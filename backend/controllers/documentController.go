package controllers

import (
	"docdrop-backend/aws"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"docdrop-backend/redis"
	"docdrop-backend/services"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetDocumentbyId godoc
// @Summary      Get document by ID
// @Description  Returns a single document by its ID
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Document ID"
// @Success      200  {object}  models.Document
// @Failure      500  {object}  map[string]string
// @Router       /documents/{id} [get]
func GetDocumentbyId(c *gin.Context) {
	log.Println("GetDocument controller started")

	document, err := services.GetDocumentbyId(c.Param("id"))
	if err != nil {
		log.Println("GetDocument controller failed")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("GetDocument controller executed successfully")
	c.JSON(http.StatusOK, document)
}

// GetDocumentsByProjectId godoc
// @Summary      List documents for a project
// @Description  Returns all documents for the given project ID
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Project ID"
// @Success      200  {array}   models.Document
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /projects/{id}/documents [get]
func GetDocumentsByProjectId(c *gin.Context) {
	log.Println("GetDocumentsByProjectId controller started")
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project id required"})
		return
	}
	documents, err := services.GetDocumentsByProjectID(projectID)
	if err != nil {
		log.Println("GetDocumentsByProjectId controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Println("GetDocumentsByProjectId controller executed successfully")
	c.JSON(http.StatusOK, documents)
}

// CreateDocument godoc
// @Summary      Create a document
// @Description  Create a new document
// @Tags         documents
// @Accept       json
// @Produce      json
// @Param        document  body      models.CreateDocumentRequest  true  "Document payload"
// @Success      200       {object}  models.Document
// @Failure      500       {object}  map[string]string
// @Router       /documents [post]
func CreateDocument(c *gin.Context) {
	log.Println("CreateDocument controller started")

	var req models.CreateDocumentRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Println("CreateDocument controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	document := models.Document{
		Title:                req.Title,
		FileKey:              req.FileKey,
		MimeType:             req.MimeType,
		DocumentType:         req.DocumentType,
		FileSize:             req.FileSize,
		UploadedAt:           req.UploadedAt,
		CurrentPage:          req.CurrentPage,
		TotalPages:           req.TotalPages,
		CurrentVersionNumber: req.CurrentVersionNumber,
		ProjectID:            req.ProjectID,
		IsFavorite:           req.IsFavorite,
		Tag:                  req.Tag,
	}

	document, err = services.CreateDocument(document)
	if err != nil {
		log.Println("CreateDocument controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("CreateDocument controller executed successfully")
	c.JSON(http.StatusCreated, document)
}

// UploadDocument godoc
// @Summary      Upload a document or get a presigned upload URL
// @Description  Accepts multipart/form-data to upload a file to S3 and create metadata, or JSON to return a presigned upload URL
// @Tags         documents
// @Accept       json, multipart/form-data
// @Produce      json
// @Param        file  formData  file  false  "File to upload (multipart only)"
// @Param        title  formData  string  false  "Document title (multipart only)"
// @Param        mimeType  formData  string  false  "Mime type (multipart only)"
// @Param        documentType  formData  string  false  "Document type (multipart only)"
// @Param        projectId  formData  int  false  "Project ID (multipart only)"
// @Success      200   {object}  object
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /documents/upload [post]
func UploadDocument(c *gin.Context) {
	if strings.HasPrefix(strings.ToLower(c.GetHeader("Content-Type")), "multipart/") {
		fileHeader, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
			return
		}
		defer file.Close()

		projectIDValue := strings.TrimSpace(c.PostForm("projectId"))
		if projectIDValue == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "projectId is required"})
			return
		}
		projectID, err := strconv.ParseUint(projectIDValue, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid projectId"})
			return
		}

		isFavorite := false
		if value := strings.TrimSpace(c.PostForm("isFavorite")); value != "" {
			parsed, err := strconv.ParseBool(value)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid isFavorite"})
				return
			}
			isFavorite = parsed
		}

		tag, err := parseDocTag(strings.TrimSpace(c.PostForm("tag")))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag"})
			return
		}

		userVal, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user, ok := userVal.(models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
			return
		}
		uploadedBy := user.Email
		if uploadedBy == "" {
			uploadedBy = user.Username
		}

		mimeType := strings.TrimSpace(c.PostForm("mimeType"))
		if mimeType == "" {
			mimeType = fileHeader.Header.Get("Content-Type")
		}

		input := services.UploadDocumentInput{
			File:         file,
			FileName:     fileHeader.Filename,
			Title:        strings.TrimSpace(c.PostForm("title")),
			MimeType:     mimeType,
			DocumentType: strings.TrimSpace(c.PostForm("documentType")),
			FileSize:     fileHeader.Size,
			ProjectID:    uint(projectID),
			IsFavorite:   isFavorite,
			Tag:          tag,
			UploadedBy:   uploadedBy,
		}

		document, err := services.UploadDocument(c.Request.Context(), input)
		if err != nil {
			log.Printf("UploadDocument failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if _, err := services.MaybeEnqueueConversionForDocument(c.Request.Context(), document.ID); err != nil {
			log.Printf("UploadDocument conversion enqueue failed: %v", err)
		}
		c.JSON(http.StatusCreated, document)
		return
	}

	var req models.UploadDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	uploadURL, fileKey, err := services.GetUploadPresignedUrlWithKey(req.FileName, req.ContentType)
	if err != nil {
		log.Printf("GetUploadPresignedUrl failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload URL"})
		return
	}
	expiresAt := time.Now().Add(aws.UploadURLExpiry())
	c.JSON(http.StatusOK, gin.H{"uploadUrl": uploadURL, "fileKey": fileKey, "expiresAt": expiresAt})
}

// UploadNewVersion godoc
// @Summary      Upload new version of a document
// @Description  Creates a new version record, updates the document, and returns a presigned S3 URL for uploading the new version file
// @Tags         documents
// @Accept       json
// @Produce      json
// @Param        body  body      models.NewVersionRequest  true  "Document ID, file name, content type, and optional file size"
// @Success      200   {object}  object{uploadUrl=string,versionNumber=int}
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /documents/new-version [post]
func UploadNewVersion(c *gin.Context) {
	log.Println("UploadNewVersion controller started")
	var req models.NewVersionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userVal.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return
	}
	uploadedBy := user.Email
	if uploadedBy == "" {
		uploadedBy = user.Username
	}
	uploadURL, versionNumber, err := services.UploadNewVersion(req.DocumentID, req.FileName, req.ContentType, uploadedBy, req.FileSize)
	if err != nil {
		log.Printf("UploadNewVersion failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Println("UploadNewVersion controller executed successfully")
	expiresAt := time.Now().Add(aws.UploadURLExpiry())
	c.JSON(http.StatusCreated, gin.H{"uploadUrl": uploadURL, "versionNumber": versionNumber, "expiresAt": expiresAt})
}

// GetDocumentVersions godoc
// @Summary      Get all versions of a document
// @Description  Returns all version records for a document by its ID, ordered by version number
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Document ID"
// @Success      200  {array}   models.DocumentVersion
// @Failure      500  {object}  map[string]string
// @Router       /documents/versions/{id} [get]
func GetDocumentVersions(c *gin.Context) {
	log.Println("GetDocumentVersions controller started")
	versions, err := services.GetDocumentVersions(c.Param("id"))
	if err != nil {
		log.Println("GetDocumentVersions controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Println("GetDocumentVersions controller executed successfully")
	c.JSON(http.StatusOK, versions)
}

// GetDocumentDownloadUrl godoc
// @Summary      Get document download URL
// @Description  Returns a fresh presigned download URL for a document (regenerated if expired)
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Document ID"
// @Success      200  {object}  object{downloadUrl=string,expiresAt=string}
// @Failure      500  {object}  map[string]string
// @Router       /documents/{id}/download-url [get]
func GetDocumentDownloadUrl(c *gin.Context) {
	log.Println("GetDocumentDownloadUrl controller started")
	downloadURL, expiresAt, err := services.GetDocumentDownloadURL(c.Param("id"))
	if err != nil {
		log.Println("GetDocumentDownloadUrl controller failed")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	response := gin.H{"downloadUrl": downloadURL}
	if !expiresAt.IsZero() {
		response["expiresAt"] = expiresAt
	}
	log.Println("GetDocumentDownloadUrl controller executed successfully")
	c.JSON(http.StatusOK, response)
}

func parseStringSliceField(c *gin.Context, key string) (models.StringSlice, error) {
	values := c.PostFormArray(key)
	if len(values) == 0 {
		values = c.PostFormArray(key + "[]")
	}
	if len(values) > 0 {
		return models.StringSlice(values), nil
	}
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return models.StringSlice{}, nil
	}
	if strings.HasPrefix(raw, "[") {
		var parsed []string
		if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
			return nil, err
		}
		return models.StringSlice(parsed), nil
	}
	parts := strings.Split(raw, ",")
	filtered := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			filtered = append(filtered, trimmed)
		}
	}
	return models.StringSlice(filtered), nil
}

func parseDocTag(value string) (*models.DocTag, error) {
	if value == "" {
		return nil, nil
	}
	tag := models.DocTag(value)
	switch tag {
	case models.DocTagRed, models.DocTagGreen, models.DocTagYellow:
		return &tag, nil
	default:
		return nil, fmt.Errorf("invalid tag")
	}
}

// DeleteDocument godoc
// @Summary      Delete a document
// @Description  Soft-deletes the document in Postgres and best-effort deletes all version files from S3
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Document ID"
// @Success      200  {object}  services.DeleteDocumentResult
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /documents/{id} [delete]
func DeleteDocument(c *gin.Context) {
	log.Println("DeleteDocument controller started")
	idVal := strings.TrimSpace(c.Param("id"))
	parsed, err := strconv.ParseUint(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	result, err := services.DeleteDocumentbyID(uint(parsed))
	if err != nil {
		log.Println("DeleteDocument controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Println("DeleteDocument controller executed successfully")
	c.JSON(http.StatusOK, result)
}

// EnqueueDocumentConversion godoc
// @Summary      Enqueue conversion for a document version
// @Description  Enqueues a PPTX to PDF conversion job for a specific document version
// @Tags         documents
// @Produce      json
// @Param        id   path      string  true  "Document ID"
// @Param        versionNumber path string true "Version number"
// @Param        force query bool false "Force re-conversion if previously failed"
// @Success      200  {object}  object
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /documents/{id}/versions/{versionNumber}/convert [post]
func EnqueueDocumentConversion(c *gin.Context) {
	idVal := strings.TrimSpace(c.Param("id"))
	parsedID, err := strconv.ParseUint(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	versionVal := strings.TrimSpace(c.Param("versionNumber"))
	versionNumber, err := strconv.Atoi(versionVal)
	if err != nil || versionNumber <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid versionNumber"})
		return
	}

	force := false
	if forceVal := strings.TrimSpace(c.Query("force")); forceVal != "" {
		parsed, err := strconv.ParseBool(forceVal)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid force"})
			return
		}
		force = parsed
	}

	version, err := services.EnqueueConversionForVersion(c.Request.Context(), uint(parsedID), versionNumber, force)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document version not found"})
			return
		}
		if errors.Is(err, services.ErrConversionNotSupported) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "conversion not supported"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"conversionStatus":   version.ConversionStatus,
		"conversionError":    version.ConversionError,
		"conversionAttempts": version.ConversionAttempts,
		"pdfUrl":             version.PdfURL,
	}
	if version.ConvertedAt != nil {
		response["convertedAt"] = version.ConvertedAt
	}
	c.JSON(http.StatusOK, response)
}

// StreamConversionEvents godoc
// @Summary      Stream conversion events for a document version
// @Description  Streams conversion status updates as Server-Sent Events
// @Tags         documents
// @Produce      text/event-stream
// @Param        id   path      string  true  "Document ID"
// @Param        versionNumber path string true "Version number"
// @Param        token query string false "JWT token for SSE auth"
// @Success      200  {string}  string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /documents/{id}/versions/{versionNumber}/events [get]
func StreamConversionEvents(c *gin.Context) {
	idVal := strings.TrimSpace(c.Param("id"))
	parsedID, err := strconv.ParseUint(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	versionVal := strings.TrimSpace(c.Param("versionNumber"))
	versionNumber, err := strconv.Atoi(versionVal)
	if err != nil || versionNumber <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid versionNumber"})
		return
	}

	version, err := database.GetVersionByDocumentAndNumber(uint(parsedID), versionNumber)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document version not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	writer := c.Writer
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	writer.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

	update := buildConversionUpdateFromVersion(uint(parsedID), version)
	if update.Status == string(models.ConversionStatusSucceeded) && update.PdfURL != nil {
		presignPdfURL(&update)
	}

	if err := writeSSE(writer, "conversion_update", update); err != nil {
		return
	}
	flusher.Flush()

	if update.Status == string(models.ConversionStatusSucceeded) || update.Status == string(models.ConversionStatusFailed) {
		return
	}

	ctx := c.Request.Context()
	pubsub, msgCh, err := redis.SubscribeConversionUpdates(ctx, uint(parsedID))
	if err != nil {
		return
	}
	defer pubsub.Close()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			_, _ = writer.Write([]byte(": keepalive\n\n"))
			flusher.Flush()
		case msg, ok := <-msgCh:
			if !ok || msg == nil {
				continue
			}
			update, err := redis.ParseConversionUpdate(msg.Payload)
			if err != nil {
				continue
			}
			if update.VersionNumber != versionNumber {
				continue
			}
			if update.Status == string(models.ConversionStatusSucceeded) && update.PdfURL != nil {
				presignPdfURL(&update)
			}
			if err := writeSSE(writer, "conversion_update", update); err != nil {
				return
			}
			flusher.Flush()
			if update.Status == string(models.ConversionStatusSucceeded) || update.Status == string(models.ConversionStatusFailed) {
				return
			}
		}
	}
}

func buildConversionUpdateFromVersion(documentID uint, version models.DocumentVersion) redis.ConversionUpdate {
	status := string(version.ConversionStatus)
	if strings.TrimSpace(status) == "" {
		status = string(models.ConversionStatusNone)
	}
	update := redis.ConversionUpdate{
		DocumentID:    documentID,
		VersionNumber: version.VersionNumber,
		Status:        status,
		Attempts:      version.ConversionAttempts,
	}
	if version.PdfKey != nil {
		update.PdfURL = version.PdfKey
	}
	if version.ConversionError != nil {
		update.Error = version.ConversionError
	}
	if version.ConvertedAt != nil {
		update.ConvertedAt = version.ConvertedAt
	}
	return update
}

func presignPdfURL(update *redis.ConversionUpdate) {
	if update.PdfURL == nil {
		return
	}
	key := strings.TrimSpace(*update.PdfURL)
	if key == "" {
		return
	}
	if url, _, err := redis.GetDownloadURLForKey(key); err == nil && url != "" {
		update.PdfURL = &url
	}
}

func writeSSE(writer http.ResponseWriter, event string, payload redis.ConversionUpdate) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if event != "" {
		if _, err := fmt.Fprintf(writer, "event: %s\n", event); err != nil {
			return err
		}
	}
	if _, err := fmt.Fprintf(writer, "data: %s\n\n", data); err != nil {
		return err
	}
	return nil
}
