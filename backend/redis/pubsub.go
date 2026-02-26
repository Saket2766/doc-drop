package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type ConversionUpdate struct {
	DocumentID    uint       `json:"documentId"`
	VersionNumber int        `json:"versionNumber"`
	Status        string     `json:"status"`
	PdfURL        *string    `json:"pdfUrl,omitempty"`
	Error         *string    `json:"error,omitempty"`
	ConvertedAt   *time.Time `json:"convertedAt,omitempty"`
	Attempts      int        `json:"attempts"`
}

func conversionChannel(documentID uint) string {
	return fmt.Sprintf("docdrop:conversion:doc:%d", documentID)
}

func PublishConversionUpdate(ctx context.Context, update ConversionUpdate) error {
	c, _, err := Client()
	if err != nil {
		return err
	}
	payload, err := json.Marshal(update)
	if err != nil {
		return err
	}
	return c.Publish(ctx, conversionChannel(update.DocumentID), payload).Err()
}

func SubscribeConversionUpdates(ctx context.Context, documentID uint) (*goredis.PubSub, <-chan *goredis.Message, error) {
	c, _, err := Client()
	if err != nil {
		return nil, nil, err
	}
	channel := conversionChannel(documentID)
	ps := c.Subscribe(ctx, channel)
	if _, err := ps.Receive(ctx); err != nil {
		_ = ps.Close()
		return nil, nil, err
	}
	return ps, ps.Channel(), nil
}

func ParseConversionUpdate(payload string) (ConversionUpdate, error) {
	var update ConversionUpdate
	if err := json.Unmarshal([]byte(payload), &update); err != nil {
		return ConversionUpdate{}, err
	}
	return update, nil
}

func DefaultConversionUpdate(documentID uint, versionNumber int, status string, attempts int) ConversionUpdate {
	return ConversionUpdate{
		DocumentID:    documentID,
		VersionNumber: versionNumber,
		Status:        status,
		Attempts:      attempts,
	}
}

func ParseUintValue(value string) (uint, error) {
	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(parsed), nil
}
