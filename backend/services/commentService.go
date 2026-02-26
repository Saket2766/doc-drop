package services

import (
	"crypto/rand"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"fmt"
	"log"
)

func generateCommentID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

func CreateComment(comment models.Comment) (models.Comment, error) {
	log.Println("CreateComment service started")
	if comment.ID == "" {
		id, err := generateCommentID()
		if err != nil {
			log.Println("CreateComment service failed: could not generate ID")
			return comment, err
		}
		comment.ID = id
	}
	comment, err := database.CreateComment(comment)
	if err != nil {
		log.Println("CreateComment service failed")
		return comment, err
	}
	log.Println("CreateComment service executed successfully")
	return comment, nil
}

func GetCommentbyId(id string) (models.Comment, error) {
	log.Println("GetCommentbyId service started")
	comment, err := database.GetCommentbyId(id)
	if err != nil {
		log.Println("GetCommentbyId service failed")
		return comment, err
	}
	log.Println("GetCommentbyId service executed successfully")
	return comment, nil
}

// GetCommentsByDocumentID returns all comments for a document.
func GetCommentsByDocumentID(documentID uint) ([]models.Comment, error) {
	log.Println("GetCommentsByDocumentID service started")
	comments, err := database.GetCommentsByDocumentID(documentID)
	if err != nil {
		log.Println("GetCommentsByDocumentID service failed")
		return nil, err
	}
	log.Println("GetCommentsByDocumentID service executed successfully")
	return comments, nil
}
