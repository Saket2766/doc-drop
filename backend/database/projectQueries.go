package database

import (
	"docdrop-backend/models"
	"log"
	"strconv"
)

func CreateProject(project models.Project) (models.Project, error) {
	log.Println("CreateProject database query started")
	err := DB.Create(&project).Error
	if err != nil {
		log.Println("CreateProject database query failed")
		return project, err
	}
	log.Println("CreateProject database query executed successfully")
	return project, nil
}

func GetProjectbyId(id string) (models.Project, error) {
	log.Println("GetProjectbyId database query started")
	pid, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Println("GetProjectbyId database query failed: invalid id")
		return models.Project{}, err
	}
	var project models.Project
	err = DB.Where("id = ?", uint(pid)).First(&project).Error
	if err != nil {
		log.Println("GetProjectbyId database query failed")
		return project, err
	}
	log.Println("GetProjectbyId database query executed successfully")
	return project, nil
}

func GetAllProject() ([]models.Project, error) {
	log.Println("GetAllProject database query started")

	var projects []models.Project
	err := DB.Find(&projects).Error
	if err != nil {
		log.Println("GetAllProject database query failed")
		return projects, err
	}
	log.Println("GetAllProject database query executed successfully")
	return projects, nil
}

// GetAllProjectsAccessibleByUser returns all projects the user has any access to:
// owned (user_id), or creator identifier, or in editor_access_users, or in viewer_access_users.
func GetAllProjectsAccessibleByUser(userID uint, identifier string) ([]models.Project, error) {
	log.Println("GetAllProjectsAccessibleByUser database query started")
	var projects []models.Project
	// Use raw SQL so we can use jsonb_build_array for JSONB array containment on PostgreSQL.
	err := DB.Raw(
		`SELECT * FROM docdrop_projects WHERE deleted_at IS NULL AND (
			user_id = ? OR creator = ? OR
			editor_access_users @> jsonb_build_array(?::text) OR
			viewer_access_users @> jsonb_build_array(?::text)
		) ORDER BY updated_at DESC`,
		userID, identifier, identifier, identifier,
	).Scan(&projects).Error
	if err != nil {
		log.Println("GetAllProjectsAccessibleByUser database query failed")
		return projects, err
	}
	log.Println("GetAllProjectsAccessibleByUser database query executed successfully")
	return projects, nil
}

func GetAllProjectByUserID(userID uint) ([]models.Project, error) {
	log.Println("GetAllProjectByUserID database query started")
	var projects []models.Project
	err := DB.Where("user_id = ?", userID).Find(&projects).Error
	if err != nil {
		log.Println("GetAllProjectByUserID database query failed")
		return projects, err
	}
	log.Println("GetAllProjectByUserID database query executed successfully")
	return projects, nil
}

func DeleteProject(id string) error {
	log.Println("DeleteProject database query started")
	pid, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Println("DeleteProject database query failed: invalid id")
		return err
	}
	err = DB.Where("id = ?", uint(pid)).Delete(&models.Project{}).Error
	if err != nil {
		log.Println("DeleteProject database query failed")
		return err
	}
	log.Println("DeleteProject query executed successfully")
	return nil
}

// UpdateProject saves the given project (e.g. after modifying EditorAccessUsers or ViewerAccessUsers).
func UpdateProject(project *models.Project) error {
	log.Println("UpdateProject database query started")
	if err := DB.Save(project).Error; err != nil {
		log.Println("UpdateProject database query failed")
		return err
	}
	log.Println("UpdateProject database query executed successfully")
	return nil
}
