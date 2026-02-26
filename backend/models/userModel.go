package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique" json:"username"`
	Email     string    `gorm:"unique" json:"email"`
	Password  string    `gorm:"type:text;not null" json:"-"` // bcrypt hash (60 chars)
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`

	//Relations
	Projects []Project `gorm:"foreignKey:UserID" json:"projects,omitempty"`
}

func (User) TableName() string {
	return "docdrop_users"
}
