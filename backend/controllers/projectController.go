package controllers

import (
	"docdrop-backend/models"
	"docdrop-backend/services"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GrantProjectAccessRequest is the body for POST /auth/project/:projectID.
type GrantProjectAccessRequest struct {
	UserIdentifier string `json:"userIdentifier" binding:"required"`
	Role           string `json:"role" binding:"required"` // "editor" or "viewer"
}

// RevokeProjectAccessRequest is the body for DELETE /auth/project/:projectID.
type RevokeProjectAccessRequest struct {
	UserIdentifier string `json:"userIdentifier" binding:"required"`
}

// GetAllProject godoc
// @Summary      List projects for current user
// @Description  Returns projects associated with the authenticated user
// @Tags         projects
// @Produce      json
// @Success      200  {array}   models.Project
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /projects [get]
func GetAllProject(c *gin.Context) {
	log.Println("GetProject Controller started")

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userVal.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return
	}

	// User identifier (email or username) used for project ACL matching
	identifier := strings.TrimSpace(user.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(user.Username)
	}
	projects, err := services.GetAllProjectsAccessibleByUser(user.ID, identifier)
	if err != nil {
		log.Println("GetProject controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("GetProject controller executed successfully")
	c.JSON(http.StatusOK, projects)
}

// GetProjectbyId godoc
// @Summary      Get project by ID
// @Description  Returns a single project by its ID
// @Tags         projects
// @Produce      json
// @Param        id   path      string  true  "Project ID"
// @Success      200  {object}  models.Project
// @Failure      500  {object}  map[string]string
// @Router       /projects/{id} [get]
func GetProjectbyId(c *gin.Context) {
	log.Println("GetProject controller started")

	project, err := services.GetProjectbyId(c.Param("id"))
	if err != nil {
		log.Println("GetProject controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("GetProject controller executed successfully")
	c.JSON(http.StatusOK, project)
}

// CreateProject godoc
// @Summary      Create a project
// @Description  Create a new project
// @Tags         projects
// @Accept       json
// @Produce      json
// @Param        project  body      models.Project  true  "Project payload"
// @Success      200      {object}  models.Project
// @Failure      500      {object}  map[string]string
// @Router       /projects [post]
func CreateProject(c *gin.Context) {
	log.Println("CreateProject controller started")

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userVal.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return
	}
	creator := user.Email
	if creator == "" {
		creator = user.Username
	}

	var project models.Project
	err := c.ShouldBindJSON(&project)
	if err != nil {
		log.Println("CreateProject controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	project.Creator = creator
	project.EditorAccessUsers = models.StringSlice{creator} // creator is also an editor
	project.ViewerAccessUsers = nil

	project, err = services.CreateProject(project)
	if err != nil {
		log.Println("CreateProject controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Println("CreateProject controller executed successfully")
	c.JSON(http.StatusCreated, project)
}

// DeleteProject godoc
// @Summary      Delete a project
// @Description  Deletes a project by ID
// @Tags         projects
// @Produce      json
// @Param        id   path      string  true  "Project ID"
// @Success      200  {object}  object{Message=string}
// @Failure      500  {object}  map[string]string
// @Router       /projects/{id} [delete]
func DeleteProject(c *gin.Context) {
	log.Println("Delete Controller Project started")
	id := c.Param("id")
	err := services.DeleteProject(id)
	if err != nil {
		log.Println("DeleteProject controller failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Println("Delete Project Controller executed successfully")
	c.JSON(http.StatusOK, gin.H{"Message": "Project Deleted successfully"})
}

// GrantProjectAccess godoc
// @Summary      Grant access to a project
// @Description  Add a user as editor or viewer (creator only). POST /auth/project/:projectID
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        projectID  path      string  true  "Project ID"
// @Param        body      body      GrantProjectAccessRequest  true  "userIdentifier and role (editor|viewer)"
// @Success      200  {object}  models.Project
// @Failure      400  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /auth/project/{projectID} [post]
func GrantProjectAccess(c *gin.Context) {
	projectID := c.Param("projectID")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project id required"})
		return
	}
	var req GrantProjectAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role := services.GrantProjectAccessRole(req.Role)
	if role != services.GrantRoleEditor && role != services.GrantRoleViewer {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be editor or viewer"})
		return
	}
	project, err := services.GrantProjectAccess(projectID, req.UserIdentifier, role)
	if err != nil {
		if err == services.ErrInvalidAccessInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("GrantProjectAccess failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

// RevokeProjectAccess godoc
// @Summary      Revoke access from a project
// @Description  Remove a user from editor and viewer lists (creator only). DELETE /auth/project/:projectID
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        projectID  path      string  true  "Project ID"
// @Param        body      body      RevokeProjectAccessRequest  true  "userIdentifier"
// @Success      200  {object}  models.Project
// @Failure      400  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /auth/project/{projectID} [delete]
func RevokeProjectAccess(c *gin.Context) {
	projectID := c.Param("projectID")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project id required"})
		return
	}
	var req RevokeProjectAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	project, err := services.RevokeProjectAccess(projectID, req.UserIdentifier)
	if err != nil {
		if err == services.ErrInvalidAccessInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("RevokeProjectAccess failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}
