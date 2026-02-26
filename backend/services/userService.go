package services

import (
	"docdrop-backend/auth"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"errors"
	"log"
	"strings"
)

// CreateUserRequest is the request body for creating a user (password is bound from JSON).
type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func CreateUser(user models.User) (models.User, error) {
	log.Println("CreateUser service started")
	user.Email = strings.TrimSpace(strings.ToLower(user.Email))
	hashed, err := auth.HashPassword(user.Password)
	if err != nil {
		log.Println("CreateUser service failed: password hash")
		return user, err
	}
	user.Password = hashed
	user, err = database.CreateUser(user)
	if err != nil {
		log.Println("CreateUser service failed")
		return user, err
	}
	log.Println("CreateUser service executed successfully")
	return user, nil
}

func GetUserbyId(id string) (models.User, error) {
	log.Println("GetUserbyId service started")
	user, err := database.GetUserbyId(id)
	if err != nil {
		log.Println("GetUserbyId service failed")
		return user, err
	}
	log.Println("GetUserbyId service executed successfully")
	return user, nil
}

func UpdateUserbyId(id string, payload map[string]interface{}) (models.User, error) {
	log.Println("UpdateUser service started")
	if raw, ok := payload["password"]; ok && raw != nil {
		plain, ok := raw.(string)
		if !ok {
			log.Println("UpdateUser service: password field invalid type")
			return models.User{}, errors.New("password must be a string")
		}
		hashed, err := auth.HashPassword(plain)
		if err != nil {
			log.Println("UpdateUser service failed: password hash")
			return models.User{}, err
		}
		payload["password"] = hashed
	}

	user, err := database.UpdateUserbyId(id, payload)
	if err != nil {
		log.Println("UpdateUserbyId service failed")
		return user, err
	}
	log.Println("UpdateUser service executed successfully")
	return user, nil
}

// SearchUsers returns users whose email or username contains the query (case-insensitive).
func SearchUsers(query string) ([]models.User, error) {
	log.Println("SearchUsers service started")
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}
	users, err := database.SearchUsersByEmailOrUsername(query)
	if err != nil {
		log.Println("SearchUsers service failed")
		return nil, err
	}
	log.Println("SearchUsers service executed successfully")
	return users, nil
}