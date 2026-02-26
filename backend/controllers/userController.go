package controllers

import (
	"docdrop-backend/models"
	"docdrop-backend/services"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetUserbyId godoc
// @Summary      Get user by ID
// @Description  Returns a single user by ID
// @Tags         users
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      200  {object}  models.User
// @Failure      500  {object}  map[string]string
// @Router       /users/{id} [get]
func GetUserbyId(c *gin.Context) {
	log.Println("GetUser controller started")

	user, err := services.GetUserbyId(c.Param("id"))
	if err != nil {
		log.Println("GetUser controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("GetUser controller executed successfully")
	c.JSON(http.StatusOK, user)
}

// CreateUser godoc
// @Summary      Create a user
// @Description  Create a new user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      services.CreateUserRequest  true  "User payload (username, email, password)"
// @Success      200   {object}  models.User
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /users [post]
func CreateUser(c *gin.Context) {
	log.Println("CreateUser controller started")

	type createUserRequest struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	var req createUserRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Println("CreateUser controller failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	user, err = services.CreateUser(user)
	if err != nil {
		log.Println("CreateUser controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("CreateUser controller executed successfully")
	c.JSON(http.StatusCreated, user)
}

// UpdateUserbyId godoc
// @Summary      Update user by ID
// @Description  Partially update a user by ID (supports optional fields)
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string  true   "User ID"
// @Param        body  body      object  true   "Fields to update (username, email, password, etc.)"
// @Success      200   {object}  models.User
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /users/{id} [patch]
func UpdateUserbyId(c *gin.Context) {
	log.Println("UpdateUser controller started")

	var payload map[string]interface{}
	err := c.ShouldBindJSON(&payload)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	var user models.User
	user, err = services.UpdateUserbyId(c.Param("id"), payload)
	if err != nil {
		log.Println("UpdateUser controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("UpdateUser controller executed successfully")
	c.JSON(http.StatusOK, user)
}

// SearchUsers godoc
// @Summary      Search users by email or username
// @Description  Returns users whose email or username contains the query string (case-insensitive). Requires auth.
// @Tags         users
// @Produce      json
// @Param        q   query     string  true  "Search query (email or username substring)"
// @Success      200  {array}   models.User
// @Failure      500  {object}  map[string]string
// @Router       /users/search [get]
func SearchUsers(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		c.JSON(http.StatusOK, []models.User{})
		return
	}
	users, err := services.SearchUsers(q)
	if err != nil {
		log.Println("SearchUsers controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}
