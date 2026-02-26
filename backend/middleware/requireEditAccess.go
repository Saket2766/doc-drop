package middleware

import (
	"bytes"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RequireEditAccess runs after RequireAuth. It ensures the authenticated user has edit access
// to the document (i.e. is the project creator or in editorAccessUsers).
// Document ID is read from the route param "id".
func RequireEditAccess(c *gin.Context) {
	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document id required"})
		c.Abort()
		return
	}
	doc, err := database.GetDocumentbyId(documentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	project, err := database.GetProjectbyId(strconv.FormatUint(uint64(doc.ProjectID), 10))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	userVal, _ := c.Get("user")
	user := userVal.(models.User)
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	if !hasEditAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no edit access to this document"})
		c.Abort()
		return
	}
	c.Next()
}

func hasEditAccess(p models.Project, identifier string) bool {
	if identifier == "" {
		return false
	}
	if p.Creator == identifier {
		return true
	}
	for _, e := range p.EditorAccessUsers {
		if e == identifier {
			return true
		}
	}
	return false
}

func getIdentifier(c *gin.Context) string {
	userVal, _ := c.Get("user")
	user := userVal.(models.User)
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	return identifier
}

// RequireEditAccessByProjectIDForm runs after RequireAuth. It ensures the user has edit access to the project.
// Project ID is read from form field "projectId" (e.g. POST /documents/upload multipart).
// If the request is not multipart (e.g. JSON for presigned URL), the check is skipped. If multipart and projectId is missing, 400.
func RequireEditAccessByProjectIDForm(c *gin.Context) {
	if !strings.HasPrefix(strings.ToLower(c.GetHeader("Content-Type")), "multipart/") {
		c.Next()
		return
	}
	projectIDValue := strings.TrimSpace(c.PostForm("projectId"))
	if projectIDValue == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "projectId is required"})
		c.Abort()
		return
	}
	project, err := database.GetProjectbyId(projectIDValue)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	identifier := getIdentifier(c)
	if !hasEditAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no edit access to this project"})
		c.Abort()
		return
	}
	c.Next()
}

// RequireEditAccessByProjectIDBody runs after RequireAuth. It ensures the user has edit access to the project.
// Project ID is read from JSON body field "projectId". The request body is read and restored so the controller can bind it.
func RequireEditAccessByProjectIDBody(c *gin.Context) {
	data, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		c.Abort()
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(data))
	var payload struct {
		ProjectID *uint `json:"projectId"`
	}
	if err := json.Unmarshal(data, &payload); err != nil || payload.ProjectID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "projectId is required"})
		c.Abort()
		return
	}
	projectIDStr := strconv.FormatUint(uint64(*payload.ProjectID), 10)
	project, err := database.GetProjectbyId(projectIDStr)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	identifier := getIdentifier(c)
	if !hasEditAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no edit access to this project"})
		c.Abort()
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(data))
	c.Next()
}

// RequireEditAccessByDocumentIDBody runs after RequireAuth. It ensures the user has edit access to the document's project.
// Document ID is read from JSON body field "documentId". The request body is read and restored so the controller can bind it.
func RequireEditAccessByDocumentIDBody(c *gin.Context) {
	data, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		c.Abort()
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(data))
	var payload struct {
		DocumentID *uint `json:"documentId"`
	}
	if err := json.Unmarshal(data, &payload); err != nil || payload.DocumentID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "documentId is required"})
		c.Abort()
		return
	}
	doc, err := database.GetDocumentbyId(strconv.FormatUint(uint64(*payload.DocumentID), 10))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	project, err := database.GetProjectbyId(strconv.FormatUint(uint64(doc.ProjectID), 10))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	identifier := getIdentifier(c)
	if !hasEditAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no edit access to this document"})
		c.Abort()
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(data))
	c.Next()
}
