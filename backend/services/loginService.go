package services

import (
	"docdrop-backend/auth"
	"docdrop-backend/database"
	"errors"
	"log"
	"strings"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

func Login(email, password string) (LoginResponse, error) {
	log.Println("Login service started")
	email = strings.TrimSpace(strings.ToLower(email))
	user, err := database.GetUserByEmail(email)
	if err != nil {
		log.Println("Login service failed: user not found")
		return LoginResponse{}, errors.New("invalid email or password")
	}
	if err := auth.CheckPassword(user.Password, password); err != nil {
		// Bcrypt hashes are 60 chars; if stored hash is shorter, column may be truncating
		log.Printf("Login service failed: password mismatch (stored hash length: %d, expected 60 for bcrypt)", len(user.Password))
		return LoginResponse{}, errors.New("invalid email or password")
	}
	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		log.Println("Login service failed: token generation")
		return LoginResponse{}, err
	}
	log.Println("Login service executed successfully")
	return LoginResponse{Token: token, UserID: user.ID, Username: user.Username, Email: user.Email}, nil
}
