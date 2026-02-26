package database

import (
	"docdrop-backend/models"
	"log"
)

func GetUserByUsername(username string) (models.User, error) {
	log.Println("GetUserByUsername database query started")
	var user models.User
	err := DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		log.Println("GetUserByUsername database query failed")
		return user, err
	}
	log.Println("GetUserByUsername database query executed successfully")
	return user, nil
}

func GetUserByEmail(email string) (models.User, error) {
	log.Println("GetUserByEmail database query started")
	var user models.User
	err := DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		log.Println("GetUserByEmail database query failed")
		return user, err
	}
	log.Println("GetUserByEmail database query executed successfully")
	return user, nil
}
