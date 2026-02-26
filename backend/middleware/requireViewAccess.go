package middleware

import (
	"docdrop-backend/database"
	"docdrop-backend/models"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RequireViewAccess runs after RequireAuth. It ensures the authenticated user has view access
// to the document (i.e. is the project creator, an editor, or a viewer).
// Document ID is read from the route param "id".
func RequireViewAccess(c *gin.Context) {
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
	userVal, _ := c.Get("user") // RequireAuth already ran
	user := userVal.(models.User)
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	if !hasViewAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no view access to this document"})
		c.Abort()
		return
	}
	c.Next()
}

func hasViewAccess(p models.Project, identifier string) bool {
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
	for _, v := range p.ViewerAccessUsers {
		if v == identifier {
			return true
		}
	}
	return false
}

// RequireProjectViewAccess runs after RequireAuth. It ensures the authenticated user has view access
// to the project. Project ID is read from the route param "id" (e.g. GET /projects/:id/documents).
func RequireProjectViewAccess(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project id required"})
		c.Abort()
		return
	}
	project, err := database.GetProjectbyId(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.Abort()
		return
	}
	userVal, _ := c.Get("user") // RequireAuth already ran
	user := userVal.(models.User)
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	if !hasViewAccess(project, identifier) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: no view access to this project"})
		c.Abort()
		return
	}
	c.Next()
}
