package models

import (
	"time"
)

// Comment matches the comment type from stateStore (id, message, author, createdAt, page, resolved, parentCommentId, replytoUserId, version).
type Comment struct {
	ID              string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Message         string    `gorm:"not null" json:"message"`
	Author          string    `gorm:"not null" json:"author"`
	CreatedAt       time.Time `json:"createdAt"`
	Page            *int      `json:"page,omitempty"`
	Resolved        bool      `gorm:"default:false" json:"resolved"`
	ParentCommentID *string   `gorm:"type:varchar(36);index" json:"parentCommentId,omitempty"`
	ReplyToUserID   *string   `gorm:"type:varchar(255)" json:"replytoUserId,omitempty"`
	Version         *int      `json:"version,omitempty"`
	DocumentID      uint      `gorm:"not null;index" json:"documentId"`
}

// TableName overrides the table name.
func (Comment) TableName() string {
	return "docdrop_comments"
}
