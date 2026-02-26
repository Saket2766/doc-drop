package services

import (
	"docdrop-backend/database"
	"docdrop-backend/models"
	"errors"
	"log"
	"strconv"
	"strings"
)

func GetAllProject() ([]models.Project, error) {
	log.Println("GetAll Project service started")
	projects, err := database.GetAllProject()

	if err != nil {
		log.Println("GetAllProject Service failed")
		return projects, err
	}

	log.Println("GetAllProject service executed successfully")
	return projects, nil
}

func GetAllProjectByUserID(userID uint) ([]models.Project, error) {
	log.Println("GetAllProjectByUserID service started")
	projects, err := database.GetAllProjectByUserID(userID)
	if err != nil {
		log.Println("GetAllProjectByUserID service failed")
		return projects, err
	}
	log.Println("GetAllProjectByUserID service executed successfully")
	return projects, nil
}

// GetAllProjectsAccessibleByUser returns all projects the user has any access to (owner, editor, or viewer).
func GetAllProjectsAccessibleByUser(userID uint, identifier string) ([]models.Project, error) {
	log.Println("GetAllProjectsAccessibleByUser service started")
	projects, err := database.GetAllProjectsAccessibleByUser(userID, identifier)
	if err != nil {
		log.Println("GetAllProjectsAccessibleByUser service failed")
		return nil, err
	}
	log.Println("GetAllProjectsAccessibleByUser service executed successfully")
	return projects, nil
}

func CreateProject(project models.Project) (models.Project, error) {
	log.Println("CreateProject service started")
	project, err := database.CreateProject(project)
	if err != nil {
		log.Println("CreateProject service failed")
		return project, err
	}
	log.Println("CreateProject service executed successfully")
	return project, nil
}

func GetProjectbyId(id string) (models.Project, error) {
	log.Println("GetProjectbyId service started")
	project, err := database.GetProjectbyId(id)
	if err != nil {
		log.Println("GetProjectbyId service failed")
		return project, err
	}
	log.Println("GetProjectbyId service executed successfully")
	return project, nil
}

func DeleteProject(id string) error {
	log.Println("DeleteProject service started")
	pid, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Println("DeleteProject service failed: invalid id")
		return err
	}
	projectID := uint(pid)

	// Verify project exists
	_, err = database.GetProjectbyId(id)
	if err != nil {
		log.Println("DeleteProject service failed: project not found")
		return err
	}

	// Delete all documents in the project (versions, comments, S3 objects via DeleteDocumentbyID)
	documents, err := database.GetDocumentsByProjectID(projectID)
	if err != nil {
		log.Println("DeleteProject service failed: get documents")
		return err
	}
	for _, doc := range documents {
		if _, err := DeleteDocumentbyID(doc.ID); err != nil {
			log.Printf("DeleteProject: failed to delete document %d: %v", doc.ID, err)
			return err
		}
	}

	err = database.DeleteProject(id)
	if err != nil {
		log.Println("DeleteProject service failed: delete project")
		return err
	}
	log.Println("DeleteProject service executed successfully")
	return nil
}

// GrantProjectAccessRole is the role to grant (editor or viewer).
type GrantProjectAccessRole string

const (
	GrantRoleEditor GrantProjectAccessRole = "editor"
	GrantRoleViewer GrantProjectAccessRole = "viewer"
)

// GrantProjectAccess adds userIdentifier to the project's editor or viewer list. Creator-only.
var ErrInvalidAccessInput = errors.New("invalid user identifier or role")

func GrantProjectAccess(projectID string, userIdentifier string, role GrantProjectAccessRole) (models.Project, error) {
	userIdentifier = strings.TrimSpace(userIdentifier)
	if userIdentifier == "" {
		return models.Project{}, ErrInvalidAccessInput
	}
	project, err := database.GetProjectbyId(projectID)
	if err != nil {
		return models.Project{}, err
	}
	switch role {
	case GrantRoleEditor:
		if contains(project.EditorAccessUsers, userIdentifier) {
			return project, nil
		}
		project.EditorAccessUsers = append(project.EditorAccessUsers, userIdentifier)
		// Remove from viewers if present (promote to editor)
		project.ViewerAccessUsers = removeFromSlice(project.ViewerAccessUsers, userIdentifier)
	case GrantRoleViewer:
		if contains(project.ViewerAccessUsers, userIdentifier) {
			return project, nil
		}
		project.ViewerAccessUsers = append(project.ViewerAccessUsers, userIdentifier)
		// Do not add to editors
	default:
		return models.Project{}, ErrInvalidAccessInput
	}
	if err := database.UpdateProject(&project); err != nil {
		return models.Project{}, err
	}
	return project, nil
}

// RevokeProjectAccess removes userIdentifier from both editor and viewer lists. Creator-only.
func RevokeProjectAccess(projectID string, userIdentifier string) (models.Project, error) {
	userIdentifier = strings.TrimSpace(userIdentifier)
	if userIdentifier == "" {
		return models.Project{}, ErrInvalidAccessInput
	}
	project, err := database.GetProjectbyId(projectID)
	if err != nil {
		return models.Project{}, err
	}
	project.EditorAccessUsers = removeFromSlice(project.EditorAccessUsers, userIdentifier)
	project.ViewerAccessUsers = removeFromSlice(project.ViewerAccessUsers, userIdentifier)
	if err := database.UpdateProject(&project); err != nil {
		return models.Project{}, err
	}
	return project, nil
}

func contains(s models.StringSlice, x string) bool {
	for _, v := range s {
		if v == x {
			return true
		}
	}
	return false
}

func removeFromSlice(s models.StringSlice, x string) models.StringSlice {
	out := make(models.StringSlice, 0, len(s))
	for _, v := range s {
		if v != x {
			out = append(out, v)
		}
	}
	return out
}

func projectHasEditAccess(p models.Project, identifier string) bool {
	if identifier == "" {
		return false
	}
	if p.Creator == identifier {
		return true
	}
	for _, e := range p.EditorAccessUsers {
		if e == identifier {
			return true
		}
	}
	return false
}

// CheckProjectEditAccess returns nil if the user has edit access to the project, otherwise an error.
// Use from controllers (e.g. upload, new-version) where document id is not in the path.
func CheckProjectEditAccess(projectID string, userIdentifier string) error {
	userIdentifier = strings.TrimSpace(userIdentifier)
	if userIdentifier == "" {
		return ErrInvalidAccessInput
	}
	project, err := database.GetProjectbyId(projectID)
	if err != nil {
		return err
	}
	if projectHasEditAccess(project, userIdentifier) {
		return nil
	}
	return errors.New("forbidden: no edit access to this project")
}
