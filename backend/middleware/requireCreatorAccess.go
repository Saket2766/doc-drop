package middleware

import (
	"docdrop-backend/database"
	"docdrop-backend/models"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RequireCreatorAccess runs after RequireAuth. It ensures the authenticated user is the creator
// of the project. Project ID is read from the route param "projectID".
func RequireCreatorAccess(c *gin.Context) {
	projectID := c.Param("projectID")
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
	userVal, _ := c.Get("user")
	user := userVal.(models.User)
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	if project.Creator != identifier {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: only the project creator can perform this action"})
		c.Abort()
		return
	}
	c.Next()
}
