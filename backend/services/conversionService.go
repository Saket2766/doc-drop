package services

import (
	"context"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"docdrop-backend/redis"
	"errors"
	"fmt"
	"path"
	"strings"
)

var ErrConversionNotSupported = errors.New("conversion not supported")

func ComputePdfKey(inputKey string) string {
	trimmed := strings.TrimSpace(inputKey)
	if trimmed == "" {
		return trimmed
	}
	ext := path.Ext(trimmed)
	if ext == "" {
		return trimmed + ".pdf"
	}
	return strings.TrimSuffix(trimmed, ext) + ".pdf"
}

func MaybeEnqueueConversionForDocument(ctx context.Context, documentID uint) (*models.DocumentVersion, error) {
	doc, err := database.GetDocumentbyId(fmt.Sprintf("%d", documentID))
	if err != nil {
		return nil, err
	}
	if strings.ToLower(doc.DocumentType) != "pptx" {
		return nil, nil
	}
	return EnqueueConversionForVersion(ctx, documentID, doc.CurrentVersionNumber, false)
}

func EnqueueConversionForVersion(ctx context.Context, documentID uint, versionNumber int, force bool) (*models.DocumentVersion, error) {
	doc, err := database.GetDocumentbyId(fmt.Sprintf("%d", documentID))
	if err != nil {
		return nil, err
	}
	if strings.ToLower(doc.DocumentType) != "pptx" {
		return nil, ErrConversionNotSupported
	}

	version, err := database.GetVersionByDocumentAndNumber(documentID, versionNumber)
	if err != nil {
		return nil, err
	}

	switch version.ConversionStatus {
	case models.ConversionStatusPending, models.ConversionStatusProcessing:
		return &version, nil
	case models.ConversionStatusSucceeded:
		return &version, nil
	case models.ConversionStatusFailed:
		if !force {
			return &version, nil
		}
	}

	inputKey := strings.TrimSpace(version.FileKey)
	if inputKey == "" {
		return nil, fmt.Errorf("missing input key")
	}
	outputKey := ComputePdfKey(inputKey)

	attempts := version.ConversionAttempts
	if force && version.ConversionStatus == models.ConversionStatusFailed {
		attempts = 0
	}
	updates := map[string]interface{}{
		"conversion_status":   models.ConversionStatusPending,
		"conversion_error":    nil,
		"conversion_attempts": attempts,
		"pdf_key":             outputKey,
	}
	if err := database.UpdateDocumentVersionFields(documentID, versionNumber, updates); err != nil {
		return nil, err
	}

	version.ConversionStatus = models.ConversionStatusPending
	version.ConversionError = nil
	version.PdfKey = &outputKey
	version.PdfURL = &outputKey
	version.ConversionAttempts = attempts

	job := redis.ConversionJob{
		DocumentID:    documentID,
		VersionNumber: versionNumber,
		InputKey:      inputKey,
		OutputKey:     outputKey,
		Attempt:       version.ConversionAttempts,
	}
	if err := redis.EnqueueConversion(ctx, job); err != nil {
		return nil, err
	}

	_ = redis.PublishConversionUpdate(ctx, redis.ConversionUpdate{
		DocumentID:    documentID,
		VersionNumber: versionNumber,
		Status:        string(models.ConversionStatusPending),
		PdfURL:        &outputKey,
		Attempts:      attempts,
	})

	return &version, nil
}
