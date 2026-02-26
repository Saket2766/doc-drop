package models

import (
	"time"

	"gorm.io/gorm"
)

// Project matches the project type from stateStore (id, name, description, createdAt, updatedAt, docs, creator, editorAccessUsers, viewerAccessUsers).
type Project struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	Name                string         `gorm:"not null" json:"name"`
	Description         string         `json:"description"`
	UserID              uint           `gorm:"not null;index" json:"userId"` // owner of the project
	Creator             string         `gorm:"not null" json:"creator"`        // user identifier (email or username) who created the project; used for ACL
	EditorAccessUsers   StringSlice    `gorm:"type:jsonb" json:"editorAccessUsers"`
	ViewerAccessUsers   StringSlice    `gorm:"type:jsonb" json:"viewerAccessUsers"`
	CreatedAt           time.Time      `json:"createdAt"`
	UpdatedAt           time.Time      `json:"updatedAt"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Docs []Document `gorm:"foreignKey:ProjectID" json:"docs,omitempty"`
}

// TableName overrides the table name.
func (Project) TableName() string {
	return "docdrop_projects"
}
