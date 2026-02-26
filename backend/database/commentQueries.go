package database

import (
	"docdrop-backend/models"
	"log"
)

func CreateComment(comment models.Comment) (models.Comment, error) {
	log.Println("CreateComment database query started")
	err := DB.Create(&comment).Error
	if err != nil {
		log.Println("CreateComment database query failed")
		return comment, err
	}
	log.Println("CreateComment database query executed successfully")
	return comment, nil
}

func GetCommentbyId(id string) (models.Comment, error) {
	log.Println("GetCommentbyId database query started")
	var comment models.Comment
	err := DB.Where("id = ?", id).First(&comment).Error
	if err != nil {
		log.Println("GetCommentbyId database query failed")
		return comment, err
	}
	log.Println("GetCommentbyId database query executed successfully")
	return comment, nil
}

// GetCommentsByDocumentID returns all comments for a document, ordered by createdAt ascending.
func GetCommentsByDocumentID(documentID uint) ([]models.Comment, error) {
	log.Println("GetCommentsByDocumentID database query started")
	var comments []models.Comment
	err := DB.Where("document_id = ?", documentID).Order("created_at ASC").Find(&comments).Error
	if err != nil {
		log.Println("GetCommentsByDocumentID database query failed")
		return nil, err
	}
	log.Println("GetCommentsByDocumentID database query executed successfully")
	return comments, nil
}

// DeleteCommentsByDocumentID deletes all comments for the given document.
func DeleteCommentsByDocumentID(documentID uint) error {
	log.Println("DeleteCommentsByDocumentID database query started")
	if err := DB.Where("document_id = ?", documentID).Delete(&models.Comment{}).Error; err != nil {
		log.Println("DeleteCommentsByDocumentID database query failed")
		return err
	}
	log.Println("DeleteCommentsByDocumentID database query executed successfully")
	return nil
}
