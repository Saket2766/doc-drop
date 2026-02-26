package controllers

import (
	"docdrop-backend/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Login godoc
// @Summary      Login
// @Description  Authenticate with email and password, returns a JWT token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      services.LoginRequest   true  "email and password"
// @Success      200   {object}  services.LoginResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /login [post]
func Login(c *gin.Context) {
	log.Println("Login controller started")

	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Login controller failed: invalid body")
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
		return
	}

	resp, err := services.Login(req.Email, req.Password)
	if err != nil {
		if err.Error() == "invalid email or password" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		log.Println("Login controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("Login controller executed successfully")
	c.JSON(http.StatusOK, resp)
}
