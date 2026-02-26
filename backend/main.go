package main

// @title           DocDrop Backend API
// @version         1.0
// @description     This is a backend server for DocDrop.
// @host            localhost:8080
// @BasePath        /api/

import (
	"docdrop-backend/aws"
	"docdrop-backend/controllers"
	"docdrop-backend/database"
	"docdrop-backend/middleware"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	_ "docdrop-backend/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	//Load .env
	if err := godotenv.Load(); err != nil {
		log.Fatal(err.Error())
	}
	//initialize s3 client
	aws.InitS3Client()

	database.ConnectToDatabase()
	//database.AutoMigrate()

	const BASE_PATH string = "/api/"

	//initialize gin
	router := gin.Default()

	// CORS: allow frontend origin so browser preflight OPTIONS and API calls succeed
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	v1 := router.Group(BASE_PATH + "v1/")
	//swagger route
	v1.GET("swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// auth
	v1.POST("login", controllers.Login)
	// auth/project access (creator only)
	v1.POST("auth/project/:projectID", middleware.RequireAuth, middleware.RequireCreatorAccess, controllers.GrantProjectAccess)
	v1.DELETE("auth/project/:projectID", middleware.RequireAuth, middleware.RequireCreatorAccess, controllers.RevokeProjectAccess)

	// user routes
	v1.GET("users/search", middleware.RequireAuth, controllers.SearchUsers)
	v1.GET("users/:id", middleware.RequireAuth, controllers.GetUserbyId)
	v1.PATCH("users/:id", middleware.RequireAuth, controllers.UpdateUserbyId)
	v1.POST("users", controllers.CreateUser)
	v1.GET("comments/:id", middleware.RequireAuth, controllers.GetCommentsByDocumentID)
	v1.POST("comments", middleware.RequireAuth, controllers.CreateComment)

	// project routes (more specific route first so /projects/:id/documents matches)
	v1.GET("projects/:id/documents", middleware.RequireAuth, middleware.RequireProjectViewAccess, controllers.GetDocumentsByProjectId)
	v1.GET("projects/:id", middleware.RequireAuth, controllers.GetProjectbyId)
	v1.DELETE("projects/:id", middleware.RequireAuth, controllers.DeleteProject)
	v1.POST("projects", middleware.RequireAuth, controllers.CreateProject)
	v1.GET("projects", middleware.RequireAuth, controllers.GetAllProject)

	// document routes (view: creator, editor, or viewer; edit: creator or editor)
	v1.GET("documents/versions/:id", middleware.RequireAuth, middleware.RequireViewAccess, controllers.GetDocumentVersions)
	v1.GET("documents/:id", middleware.RequireAuth, middleware.RequireViewAccess, controllers.GetDocumentbyId)
	v1.GET("documents/:id/download-url", middleware.RequireAuth, middleware.RequireViewAccess, controllers.GetDocumentDownloadUrl)
	v1.GET("documents/:id/versions/:versionNumber/events", middleware.RequireAuth, middleware.RequireViewAccess, controllers.StreamConversionEvents)
	v1.POST("documents/upload", middleware.RequireAuth, middleware.RequireEditAccessByProjectIDForm, controllers.UploadDocument)
	v1.POST("documents/new-version", middleware.RequireAuth, middleware.RequireEditAccessByDocumentIDBody, controllers.UploadNewVersion)
	v1.POST("documents/:id/versions/:versionNumber/convert", middleware.RequireAuth, middleware.RequireEditAccess, controllers.EnqueueDocumentConversion)
	v1.POST("documents", middleware.RequireAuth, middleware.RequireEditAccessByProjectIDBody, controllers.CreateDocument)
	v1.DELETE("documents/:id", middleware.RequireAuth, middleware.RequireEditAccess, controllers.DeleteDocument)

	router.Run()
}
