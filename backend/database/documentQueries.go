package database

import (
	"docdrop-backend/models"
	"log"
	"strconv"
	"time"
)

func CreateDocument(document models.Document) (models.Document, error) {
	log.Println("CreateDocument database query started")
	err := DB.Create(&document).Error
	if err != nil {
		log.Println("CreateDocument database query failed")
		return document, err
	}
	log.Println("CreateDocument database query executed successfully")
	return document, nil
}

func GetDocumentbyId(id string) (models.Document, error) {
	log.Println("GetDocumentbyId database query started")
	did, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Println("GetDocumentbyId database query failed: invalid id")
		return models.Document{}, err
	}
	var document models.Document
	err = DB.Where("id = ?", uint(did)).First(&document).Error
	if err != nil {
		log.Println("GetDocumentbyId database query failed")
		return document, err
	}
	log.Println("GetDocumentbyId database query executed successfully")
	return document, nil
}

func DeleteDocumentById(id uint) error {
	log.Println("DeleteDocumentById database query started")
	if err := DB.Delete(&models.Document{}, id).Error; err != nil {
		log.Println("DeleteDocumentById database query failed")
		return err
	}
	log.Println("DeleteDocumentById database query executed successfully")
	return nil
}

// GetDocumentsByProjectID returns all documents for the given project ID.
func GetDocumentsByProjectID(projectID uint) ([]models.Document, error) {
	log.Println("GetDocumentsByProjectID database query started")
	var documents []models.Document
	err := DB.Where("project_id = ?", projectID).Find(&documents).Error
	if err != nil {
		log.Println("GetDocumentsByProjectID database query failed")
		return nil, err
	}
	log.Println("GetDocumentsByProjectID database query executed successfully")
	return documents, nil
}

// CreateDocumentVersion inserts a new document version record.
func CreateDocumentVersion(version models.DocumentVersion) error {
	log.Println("CreateDocumentVersion database query started")
	err := DB.Create(&version).Error
	if err != nil {
		log.Println("CreateDocumentVersion database query failed")
		return err
	}
	log.Println("CreateDocumentVersion database query executed successfully")
	return nil
}

func DeleteDocumentVersionById(id string) error {
	log.Println("DeleteDocumentVersionById database query started")
	if err := DB.Delete(&models.DocumentVersion{}, "id = ?", id).Error; err != nil {
		log.Println("DeleteDocumentVersionById database query failed")
		return err
	}
	log.Println("DeleteDocumentVersionById database query executed successfully")
	return nil
}

func DeleteVersionsByDocumentId(documentID uint) error {
	log.Println("DeleteVersionsByDocumentId database query started")
	if err := DB.Where("document_id = ?", documentID).Delete(&models.DocumentVersion{}).Error; err != nil {
		log.Println("DeleteVersionsByDocumentId database query failed")
		return err
	}
	log.Println("DeleteVersionsByDocumentId database query executed successfully")
	return nil
}

// UpdateDocumentForNewVersion updates the document's current version, file key, size, and uploaded time.
func UpdateDocumentForNewVersion(documentID uint, versionNumber int, fileKey string, fileSize int64) error {
	log.Println("UpdateDocumentForNewVersion database query started")
	result := DB.Model(&models.Document{}).Where("id = ?", documentID).Updates(map[string]interface{}{
		"current_version_number": versionNumber,
		"file_key":               fileKey,
		"file_size":              fileSize,
		"uploaded_at":            time.Now(),
	})
	if result.Error != nil {
		log.Println("UpdateDocumentForNewVersion database query failed")
		return result.Error
	}
	log.Println("UpdateDocumentForNewVersion database query executed successfully")
	return nil
}

// GetVersionsByDocumentId returns all document versions for the given document ID, ordered by version number.
func GetVersionsByDocumentId(documentID string) ([]models.DocumentVersion, error) {
	log.Println("GetVersionsByDocumentId database query started")
	did, err := strconv.ParseUint(documentID, 10, 64)
	if err != nil {
		log.Println("GetVersionsByDocumentId database query failed: invalid id")
		return nil, err
	}
	var versions []models.DocumentVersion
	err = DB.Where("document_id = ?", uint(did)).Order("version_number ASC").Find(&versions).Error
	if err != nil {
		log.Println("GetVersionsByDocumentId database query failed")
		return nil, err
	}
	log.Println("GetVersionsByDocumentId database query executed successfully")
	return versions, nil
}

// GetVersionByDocumentAndNumber returns a document version for the given document ID and version number.
func GetVersionByDocumentAndNumber(documentID uint, versionNumber int) (models.DocumentVersion, error) {
	log.Println("GetVersionByDocumentAndNumber database query started")
	var version models.DocumentVersion
	err := DB.Where("document_id = ? AND version_number = ?", documentID, versionNumber).First(&version).Error
	if err != nil {
		log.Println("GetVersionByDocumentAndNumber database query failed")
		return version, err
	}
	log.Println("GetVersionByDocumentAndNumber database query executed successfully")
	return version, nil
}

// UpdateDocumentVersionFields updates fields for the given document version.
func UpdateDocumentVersionFields(documentID uint, versionNumber int, updates map[string]interface{}) error {
	log.Println("UpdateDocumentVersionFields database query started")
	if err := DB.Model(&models.DocumentVersion{}).
		Where("document_id = ? AND version_number = ?", documentID, versionNumber).
		Updates(updates).Error; err != nil {
		log.Println("UpdateDocumentVersionFields database query failed")
		return err
	}
	log.Println("UpdateDocumentVersionFields database query executed successfully")
	return nil
}
