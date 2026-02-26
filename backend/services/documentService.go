package services

import (
	"context"
	"crypto/rand"
	"docdrop-backend/aws"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"docdrop-backend/redis"
	"fmt"
	"io"
	"log"
	"mime"
	"path"
	"strconv"
	"strings"
	"time"
)

func setPresignedUrlIfKey(document *models.Document) {
	if document.FileKey == nil || strings.TrimSpace(*document.FileKey) == "" {
		return
	}
	url, _, err := redis.GetDownloadURLForKey(*document.FileKey)
	if err != nil {
		log.Printf("GetPresignedUrl failed: %v", err)
		document.FileURL = document.FileKey
		return
	}
	document.FileURL = &url
}

func CreateDocument(document models.Document) (models.Document, error) {
	log.Println("CreateDocument service started")
	document, err := database.CreateDocument(document)
	if err != nil {
		log.Println("CreateDocument service failed")
		return document, err
	}
	setPresignedUrlIfKey(&document)
	log.Println("CreateDocument service executed successfully")
	return document, nil
}

func GetDocumentbyId(id string) (models.Document, error) {
	log.Println("GetDocumentbyId service started")
	document, err := database.GetDocumentbyId(id)
	if err != nil {
		log.Println("GetDocumentbyId service failed")
		return document, err
	}
	setPresignedUrlIfKey(&document)
	log.Println("GetDocumentbyId service executed successfully")
	return document, nil
}

// GetDocumentsByProjectID returns all documents for the given project ID, with presigned file URLs set.
func GetDocumentsByProjectID(projectID string) ([]models.Document, error) {
	log.Println("GetDocumentsByProjectID service started")
	pid, err := strconv.ParseUint(projectID, 10, 64)
	if err != nil {
		log.Println("GetDocumentsByProjectID service failed: invalid project id")
		return nil, err
	}
	documents, err := database.GetDocumentsByProjectID(uint(pid))
	if err != nil {
		log.Println("GetDocumentsByProjectID service failed")
		return nil, err
	}
	for i := range documents {
		setPresignedUrlIfKey(&documents[i])
	}
	log.Println("GetDocumentsByProjectID service executed successfully")
	return documents, nil
}

func GetDocumentDownloadURL(id string) (string, time.Time, error) {
	log.Println("GetDocumentDownloadURL service started")
	document, err := database.GetDocumentbyId(id)
	if err != nil {
		log.Println("GetDocumentDownloadURL service failed: document not found")
		return "", time.Time{}, err
	}
	if document.FileKey == nil || strings.TrimSpace(*document.FileKey) == "" {
		log.Println("GetDocumentDownloadURL service failed: missing file key")
		return "", time.Time{}, fmt.Errorf("document has no file key")
	}
	downloadURL, expiresAt, err := redis.GetDownloadURLForKey(*document.FileKey)
	if err != nil {
		log.Println("GetDocumentDownloadURL service failed: presign")
		return "", time.Time{}, err
	}
	log.Println("GetDocumentDownloadURL service executed successfully")
	return downloadURL, expiresAt, nil
}

func GetUploadPresignedUrl(fileName, contentType string) (string, error) {
	uploadURL, _, err := GetUploadPresignedUrlWithKey(fileName, contentType)
	return uploadURL, err
}

func GetUploadPresignedUrlWithKey(fileName, contentType string) (string, string, error) {
	safeFileName := sanitizeFileName(fileName)
	uploadURL, err := aws.CreateUploadPresignedUrl(safeFileName, contentType)
	if err != nil {
		return "", "", err
	}
	return uploadURL, safeFileName, nil
}

// generateVersionID returns a UUID-like string for document version IDs.
func generateVersionID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

type UploadDocumentInput struct {
	File         io.Reader
	FileName     string
	Title        string
	MimeType     string
	DocumentType string
	FileSize     int64
	ProjectID    uint
	IsFavorite   bool
	Tag          *models.DocTag
	UploadedBy   string
}

func UploadDocument(ctx context.Context, input UploadDocumentInput) (models.Document, error) {
	log.Println("UploadDocument service started")
	if input.File == nil {
		return models.Document{}, fmt.Errorf("file is required")
	}

	safeFileName := sanitizeFileName(input.FileName)
	mimeType := strings.TrimSpace(input.MimeType)
	if mimeType == "" {
		mimeType = mime.TypeByExtension(path.Ext(safeFileName))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
	}
	documentType := strings.TrimSpace(input.DocumentType)
	if documentType == "" {
		documentType = inferDocumentType(safeFileName, mimeType)
	}
	title := strings.TrimSpace(input.Title)
	if title == "" {
		title = safeFileName
	}
	uploadedBy := strings.TrimSpace(input.UploadedBy)
	now := time.Now()
	document := models.Document{
		Title:                title,
		MimeType:             mimeType,
		DocumentType:         documentType,
		FileSize:             input.FileSize,
		UploadedAt:           now,
		CurrentPage:          1,
		TotalPages:           1,
		CurrentVersionNumber: 1,
		ProjectID:            input.ProjectID,
		IsFavorite:           input.IsFavorite,
		Tag:                  input.Tag,
	}

	document, err := database.CreateDocument(document)
	if err != nil {
		log.Println("UploadDocument service failed: create document")
		return document, err
	}

	s3Key := fmt.Sprintf("%d/v1_%s", document.ID, safeFileName)
	uploadCtx, cancel := context.WithTimeout(ctx, aws.UploadTimeout())
	defer cancel()
	if err := aws.PutObject(uploadCtx, s3Key, mimeType, input.File, input.FileSize); err != nil {
		log.Printf("UploadDocument service failed: upload object %v", err)
		_ = database.DeleteDocumentById(document.ID)
		return document, err
	}

	versionID, err := generateVersionID()
	if err != nil {
		log.Printf("UploadDocument service failed: version ID %v", err)
		_ = aws.DeleteObject(context.Background(), s3Key)
		_ = database.DeleteDocumentById(document.ID)
		return document, err
	}

	version := models.DocumentVersion{
		ID:                 versionID,
		VersionNumber:      1,
		UploadedAt:         now,
		UploadedBy:         uploadedBy,
		FileKey:            s3Key,
		FileSize:           input.FileSize,
		ConversionStatus:   models.ConversionStatusNone,
		ConversionAttempts: 0,
		DocumentID:         document.ID,
	}
	if err := database.CreateDocumentVersion(version); err != nil {
		log.Println("UploadDocument service failed: create version")
		_ = aws.DeleteObject(context.Background(), s3Key)
		_ = database.DeleteDocumentById(document.ID)
		return document, err
	}
	if err := database.UpdateDocumentForNewVersion(document.ID, 1, s3Key, input.FileSize); err != nil {
		log.Println("UploadDocument service failed: update document")
		_ = database.DeleteDocumentVersionById(versionID)
		_ = aws.DeleteObject(context.Background(), s3Key)
		_ = database.DeleteDocumentById(document.ID)
		return document, err
	}

	if presigned, _, err := redis.GetDownloadURLForKey(s3Key); err == nil && presigned != "" {
		document.FileURL = &presigned
	} else {
		document.FileURL = &s3Key
	}
	document.FileKey = &s3Key
	document.MimeType = mimeType
	document.DocumentType = documentType
	document.FileSize = input.FileSize
	document.UploadedAt = now
	document.CurrentVersionNumber = 1

	log.Println("UploadDocument service executed successfully")
	return document, nil
}

// UploadNewVersion creates a new document version, updates the document, and returns a presigned upload URL.
func UploadNewVersion(documentID uint, fileName, contentType, uploadedBy string, fileSize int64) (uploadURL string, versionNumber int, err error) {
	log.Println("UploadNewVersion service started")
	doc, err := database.GetDocumentbyId(fmt.Sprintf("%d", documentID))
	if err != nil {
		log.Println("UploadNewVersion service failed: document not found")
		return "", 0, err
	}
	nextVersion := doc.CurrentVersionNumber + 1
	s3Key := fmt.Sprintf("%d/v%d_%s", documentID, nextVersion, sanitizeFileName(fileName))
	uploadURL, err = aws.CreateUploadPresignedUrl(s3Key, contentType)
	if err != nil {
		log.Printf("UploadNewVersion service failed: presigned URL %v", err)
		return "", 0, err
	}
	versionID, err := generateVersionID()
	if err != nil {
		log.Printf("UploadNewVersion service failed: version ID %v", err)
		return "", 0, err
	}
	now := time.Now()
	// Store key without "DocDrop/" so GetPresignedUrl(key) works for read URLs
	version := models.DocumentVersion{
		ID:                 versionID,
		VersionNumber:      nextVersion,
		UploadedAt:         now,
		UploadedBy:         uploadedBy,
		FileKey:            s3Key,
		FileSize:           fileSize,
		ConversionStatus:   models.ConversionStatusNone,
		ConversionAttempts: 0,
		DocumentID:         documentID,
	}
	if err := database.CreateDocumentVersion(version); err != nil {
		log.Println("UploadNewVersion service failed: create version")
		return "", 0, err
	}
	if err := database.UpdateDocumentForNewVersion(documentID, nextVersion, s3Key, fileSize); err != nil {
		log.Println("UploadNewVersion service failed: update document")
		return "", 0, err
	}
	log.Println("UploadNewVersion service executed successfully")
	return uploadURL, nextVersion, nil
}

// GetDocumentVersions returns all versions for a document by its ID.
func GetDocumentVersions(documentID string) ([]models.DocumentVersion, error) {
	log.Println("GetDocumentVersions service started")
	versions, err := database.GetVersionsByDocumentId(documentID)
	if err != nil {
		log.Println("GetDocumentVersions service failed")
		return nil, err
	}
	for i := range versions {
		fileKey := strings.TrimSpace(versions[i].FileKey)
		if fileKey != "" {
			if url, _, err := redis.GetDownloadURLForKey(fileKey); err == nil && url != "" {
				versions[i].FileURL = url
			} else {
				versions[i].FileURL = fileKey
			}
		}
		if versions[i].ConversionStatus == models.ConversionStatusSucceeded && versions[i].PdfKey != nil {
			pdfKey := strings.TrimSpace(*versions[i].PdfKey)
			if pdfKey != "" {
				if url, _, err := redis.GetDownloadURLForKey(pdfKey); err == nil && url != "" {
					versions[i].PdfURL = &url
				} else {
					versions[i].PdfURL = &pdfKey
				}
			}
		}
	}
	log.Println("GetDocumentVersions service executed successfully")
	return versions, nil
}

// DeleteDocumentResult is the response shape for DeleteDocumentbyID.
type DeleteDocumentResult struct {
	DocumentID      uint `json:"documentId"`
	VersionsDeleted int  `json:"versionsDeleted"`
	S3KeysDeleted   int  `json:"s3KeysDeleted"`
}

// DeleteDocumentbyID deletes the document from the DB and S3, along with all its versions and comments.
// Version files are removed from S3 (best-effort), then comments, versions, and the document are removed from the DB.
func DeleteDocumentbyID(documentID uint) (DeleteDocumentResult, error) {
	log.Println("DeleteDocumentbyID service started")
	result := DeleteDocumentResult{DocumentID: documentID}

	doc, err := database.GetDocumentbyId(fmt.Sprintf("%d", documentID))
	if err != nil {
		log.Println("DeleteDocumentbyID service failed: document not found")
		return result, err
	}

	versions, err := database.GetVersionsByDocumentId(fmt.Sprintf("%d", documentID))
	if err != nil {
		log.Println("DeleteDocumentbyID service failed: get versions")
		return result, err
	}

	ctx := context.Background()
	for _, v := range versions {
		fileKey := strings.TrimSpace(v.FileKey)
		if fileKey == "" {
			continue
		}
		if err := aws.DeleteObject(ctx, fileKey); err != nil {
			log.Printf("DeleteDocumentbyID: S3 delete failed for key %q: %v", fileKey, err)
		} else {
			result.S3KeysDeleted++
		}
		if v.PdfKey != nil {
			pdfKey := strings.TrimSpace(*v.PdfKey)
			if pdfKey != "" && pdfKey != fileKey {
				if err := aws.DeleteObject(ctx, pdfKey); err != nil {
					log.Printf("DeleteDocumentbyID: S3 delete failed for pdf key %q: %v", pdfKey, err)
				} else {
					result.S3KeysDeleted++
				}
			}
		}
	}
	result.VersionsDeleted = len(versions)

	if doc.FileKey != nil && strings.TrimSpace(*doc.FileKey) != "" {
		docKey := strings.TrimSpace(*doc.FileKey)
		if docKey != "" {
			alreadyDeleted := false
			for _, v := range versions {
				if strings.TrimSpace(v.FileKey) == docKey {
					alreadyDeleted = true
					break
				}
			}
			if !alreadyDeleted {
				if err := aws.DeleteObject(ctx, docKey); err != nil {
					log.Printf("DeleteDocumentbyID: S3 delete failed for document key %q: %v", docKey, err)
				} else {
					result.S3KeysDeleted++
				}
			}
		}
	}

	if err := database.DeleteCommentsByDocumentID(documentID); err != nil {
		log.Println("DeleteDocumentbyID service failed: delete comments")
		return result, err
	}
	if err := database.DeleteVersionsByDocumentId(documentID); err != nil {
		log.Println("DeleteDocumentbyID service failed: delete versions")
		return result, err
	}
	if err := database.DeleteDocumentById(documentID); err != nil {
		log.Println("DeleteDocumentbyID service failed: delete document")
		return result, err
	}

	log.Println("DeleteDocumentbyID service executed successfully")
	return result, nil
}

func sanitizeFileName(fileName string) string {
	normalized := strings.ReplaceAll(fileName, "\\", "/")
	baseName := path.Base(normalized)
	baseName = strings.TrimSpace(baseName)
	baseName = strings.ReplaceAll(baseName, " ", "_")
	if baseName == "" || baseName == "." || baseName == "/" {
		return fmt.Sprintf("file_%d", time.Now().UnixNano())
	}
	return baseName
}

func inferDocumentType(fileName, mimeType string) string {
	ext := strings.ToLower(strings.TrimPrefix(path.Ext(fileName), "."))
	switch ext {
	case "pdf":
		return "pdf"
	case "doc":
		return "doc"
	case "docx":
		return "docx"
	case "xls":
		return "xls"
	case "xlsx":
		return "xlsx"
	case "ppt":
		return "ppt"
	case "pptx":
		return "pptx"
	case "txt":
		return "txt"
	case "md":
		return "md"
	case "csv":
		return "csv"
	case "json":
		return "json"
	case "xml":
		return "xml"
	case "jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", "svg":
		return "image"
	case "mp4", "mov", "avi", "mkv", "webm":
		return "video"
	case "mp3", "wav", "aac", "flac", "ogg", "m4a":
		return "audio"
	}
	lowerMime := strings.ToLower(mimeType)
	if strings.HasPrefix(lowerMime, "image/") {
		return "image"
	}
	if strings.HasPrefix(lowerMime, "video/") {
		return "video"
	}
	if strings.HasPrefix(lowerMime, "audio/") {
		return "audio"
	}
	if strings.HasPrefix(lowerMime, "text/") {
		return "txt"
	}
	return "unknown"
}
