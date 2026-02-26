package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// DocTag matches DocTag from stateStore: "red" | "green" | "yellow".
type DocTag string

const (
	DocTagRed    DocTag = "red"
	DocTagGreen  DocTag = "green"
	DocTagYellow DocTag = "yellow"
)

// StringSlice is a []string stored as JSON in the DB (e.g. for editorAccessUsers).
type StringSlice []string

// Value implements driver.Valuer for StringSlice.
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	return json.Marshal(s)
}

// Scan implements sql.Scanner for StringSlice.
func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for StringSlice")
	}
	return json.Unmarshal(b, s)
}

type UploadDocumentRequest struct {
	FileName    string `json:"fileName" binding:"required"`
	ContentType string `json:"contentType" binding:"required"`
}

type CreateDocumentRequest struct {
	Title                string      `json:"title"`
	FileKey              *string     `json:"fileKey"`
	MimeType             string      `json:"mimeType"`
	DocumentType         string      `json:"documentType"`
	FileSize             int64       `json:"fileSize"`
	UploadedAt           time.Time   `json:"uploadedAt"`
	Creator              string      `json:"creator"`
	EditorAccessUsers    StringSlice `json:"editorAccessUsers"`
	ViewerAccessUsers    StringSlice `json:"viewerAccessUsers"`
	CurrentPage          int         `json:"currentPage"`
	TotalPages           int         `json:"totalPages"`
	CurrentVersionNumber int         `json:"currentVersionNumber"`
	ProjectID            uint        `json:"projectId"`
	IsFavorite           bool        `json:"isFavorite"`
	Tag                  *DocTag     `json:"tag"`
}

type NewVersionRequest struct {
	DocumentID  uint   `json:"documentId" binding:"required"`
	FileName    string `json:"fileName" binding:"required"`
	ContentType string `json:"contentType" binding:"required"`
	FileSize    int64  `json:"fileSize"`
}

type ConversionStatus string

const (
	ConversionStatusNone       ConversionStatus = "none"
	ConversionStatusPending    ConversionStatus = "pending"
	ConversionStatusProcessing ConversionStatus = "processing"
	ConversionStatusSucceeded  ConversionStatus = "succeeded"
	ConversionStatusFailed     ConversionStatus = "failed"
)

type DocumentVersion struct {
	ID                 string           `gorm:"primaryKey;type:varchar(36)" json:"id"`
	VersionNumber      int              `gorm:"not null" json:"versionNumber"`
	UploadedAt         time.Time        `gorm:"not null" json:"uploadedAt"`
	UploadedBy         string           `gorm:"not null" json:"uploadedBy"`
	FileKey            string           `gorm:"column:file_key;not null" json:"-"`
	FileURL            string           `gorm:"-" json:"fileUrl"`
	FileSize           int64            `gorm:"not null" json:"fileSize"`
	PdfKey             *string          `gorm:"column:pdf_key" json:"-"`
	PdfURL             *string          `gorm:"-" json:"pdfUrl"`
	ConversionStatus   ConversionStatus `gorm:"type:varchar(20);default:'none'" json:"conversionStatus"`
	ConversionError    *string          `gorm:"column:conversion_error" json:"conversionError"`
	ConvertedAt        *time.Time       `gorm:"column:converted_at" json:"convertedAt"`
	ConversionAttempts int              `gorm:"column:conversion_attempts;default:0" json:"conversionAttempts"`
	DocumentID         uint             `gorm:"not null;index" json:"documentId"`
	CreatedAt          time.Time        `json:"-"`
	UpdatedAt          time.Time        `json:"-"`
}

// TableName overrides the table name.
func (DocumentVersion) TableName() string {
	return "docdrop_document_versions"
}

type Document struct {
	ID                   uint           `gorm:"primaryKey" json:"id"`
	Title                string         `gorm:"not null" json:"title"`
	FileKey              *string        `gorm:"column:file_key" json:"-"`
	FileURL              *string        `gorm:"-" json:"fileUrl"`
	MimeType             string         `gorm:"not null" json:"mimeType"`
	DocumentType         string         `gorm:"not null" json:"documentType"`
	FileSize             int64          `json:"fileSize"`
	UploadedAt           time.Time      `json:"uploadedAt"`
	CurrentPage          int            `gorm:"default:1" json:"currentPage"`
	TotalPages           int            `gorm:"default:1" json:"totalPages"`
	CurrentVersionNumber int            `gorm:"default:1" json:"currentVersionNumber"`
	ProjectID            uint           `gorm:"not null;index" json:"projectId"`
	IsFavorite           bool           `gorm:"default:false" json:"isFavorite"`
	Tag                  *DocTag        `gorm:"type:varchar(10)" json:"tag"`
	CreatedAt            time.Time      `json:"-"`
	UpdatedAt            time.Time      `json:"-"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Project  Project           `gorm:"foreignKey:ProjectID" json:"-"`
	Comments []Comment         `gorm:"foreignKey:DocumentID" json:"comments,omitempty"`
	Versions []DocumentVersion `gorm:"foreignKey:DocumentID" json:"versions,omitempty"`
}

// TableName overrides the table name.
func (Document) TableName() string {
	return "docdrop_documents"
}
