package database

import (
	"docdrop-backend/models"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func AutoMigrate() {
	err := DB.AutoMigrate(&models.User{}, &models.Project{}, &models.Document{}, &models.DocumentVersion{}, &models.Comment{})
	if err != nil {
		log.Fatalln("failed to migrate database")
	} else {
		log.Println("Database migrated successfully")
	}
}

func ConnectToDatabase() {
	var err error

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable search_path=%s", os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_PORT"), os.Getenv("DB_SCHEMA"))
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	} else {
		log.Println("Connected to database")
	}
}
