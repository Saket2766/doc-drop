package controllers

import (
	"docdrop-backend/models"
	"docdrop-backend/services"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetCommentsByDocumentID godoc
// @Summary      Get comments by document ID
// @Description  Returns all comments for a document
// @Tags         comments
// @Produce      json
// @Param        documentId   path      int  true  "Document ID"
// @Success      200  {array}  models.Comment
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /comments/{id} [get]
func GetCommentsByDocumentID(c *gin.Context) {
	log.Println("GetCommentsByDocumentID controller started")

	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document id is required"})
		return
	}

	var docID uint
	if _, err := fmt.Sscanf(documentID, "%d", &docID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid documentId"})
		return
	}

	comments, err := services.GetCommentsByDocumentID(docID)
	if err != nil {
		log.Println("GetCommentsByDocumentID controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("GetCommentsByDocumentID controller executed successfully")
	c.JSON(http.StatusOK, comments)
}

// CreateComment godoc
// @Summary      Create a comment
// @Description  Create a new comment
// @Tags         comments
// @Accept       json
// @Produce      json
// @Param        comment  body      models.Comment  true  "Comment payload"
// @Success      200      {object}  models.Comment
// @Failure      500      {object}  map[string]string
// @Router       /comments [post]
func CreateComment(c *gin.Context) {
	log.Println("CreateComment controller started")

	var comment models.Comment
	err := c.ShouldBindJSON(&comment)
	if err != nil {
		log.Println("CreateComment controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	comment, err = services.CreateComment(comment)
	if err != nil {
		log.Println("CreateComment controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("CreateComment controller executed successfully")
	c.JSON(http.StatusCreated, comment)
}
