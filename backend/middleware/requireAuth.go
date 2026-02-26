package middleware

import (
	"docdrop-backend/auth"
	"docdrop-backend/database"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireAuth(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		token = c.Query("token")
	}
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// Accept "Bearer <token>"
	if after, ok := strings.CutPrefix(token, "Bearer "); ok {
		token = after
	}
	claims, err := auth.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	user, err := database.GetUserbyId(strconv.Itoa(int(claims.UserID)))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	c.Set("user", user)
	c.Next()
}
