package redis

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type ConversionJob struct {
	DocumentID    uint
	VersionNumber int
	InputKey      string
	OutputKey     string
	Attempt       int
}

func EnsureStreamAndGroup(ctx context.Context) error {
	c, s, err := Client()
	if err != nil {
		return err
	}
	err = c.XGroupCreateMkStream(ctx, s.Stream, s.Group, "$").Err()
	if err != nil && !strings.Contains(err.Error(), "BUSYGROUP") {
		return err
	}
	return nil
}

func EnqueueConversion(ctx context.Context, job ConversionJob) error {
	c, s, err := Client()
	if err != nil {
		return err
	}
	values := map[string]interface{}{
		"document_id":    fmt.Sprintf("%d", job.DocumentID),
		"version_number": fmt.Sprintf("%d", job.VersionNumber),
		"input_key":      job.InputKey,
		"output_key":     job.OutputKey,
		"attempt":        fmt.Sprintf("%d", job.Attempt),
	}
	args := &goredis.XAddArgs{Stream: s.Stream, Values: values}
	if s.StreamMaxLen > 0 {
		args.MaxLen = s.StreamMaxLen
		args.Approx = true
	}
	return c.XAdd(ctx, args).Err()
}

func ReadJobs(ctx context.Context, count int64, block time.Duration, consumerOverride string) ([]goredis.XMessage, error) {
	c, s, err := Client()
	if err != nil {
		return nil, err
	}
	consumer := s.Consumer
	if strings.TrimSpace(consumerOverride) != "" {
		consumer = consumerOverride
	}
	result, err := c.XReadGroup(ctx, &goredis.XReadGroupArgs{
		Group:    s.Group,
		Consumer: consumer,
		Streams:  []string{s.Stream, ">"},
		Count:    count,
		Block:    block,
	}).Result()
	if err != nil {
		if err == goredis.Nil {
			return nil, nil
		}
		return nil, err
	}
	var messages []goredis.XMessage
	for _, stream := range result {
		messages = append(messages, stream.Messages...)
	}
	return messages, nil
}

func Ack(ctx context.Context, ids ...string) error {
	if len(ids) == 0 {
		return nil
	}
	c, s, err := Client()
	if err != nil {
		return err
	}
	return c.XAck(ctx, s.Stream, s.Group, ids...).Err()
}

func ParseConversionJob(msg goredis.XMessage) (ConversionJob, error) {
	getString := func(key string) (string, error) {
		val, ok := msg.Values[key]
		if !ok {
			return "", fmt.Errorf("missing %s", key)
		}
		switch v := val.(type) {
		case string:
			return v, nil
		case []byte:
			return string(v), nil
		default:
			return fmt.Sprintf("%v", v), nil
		}
	}

	docIDStr, err := getString("document_id")
	if err != nil {
		return ConversionJob{}, err
	}
	versionStr, err := getString("version_number")
	if err != nil {
		return ConversionJob{}, err
	}
	inputKey, err := getString("input_key")
	if err != nil {
		return ConversionJob{}, err
	}
	outputKey, err := getString("output_key")
	if err != nil {
		return ConversionJob{}, err
	}
	attemptStr, _ := getString("attempt")

	docID, err := strconv.ParseUint(strings.TrimSpace(docIDStr), 10, 64)
	if err != nil {
		return ConversionJob{}, fmt.Errorf("invalid document_id: %w", err)
	}
	version, err := strconv.Atoi(strings.TrimSpace(versionStr))
	if err != nil {
		return ConversionJob{}, fmt.Errorf("invalid version_number: %w", err)
	}
	attempt := 0
	if strings.TrimSpace(attemptStr) != "" {
		if parsed, err := strconv.Atoi(strings.TrimSpace(attemptStr)); err == nil {
			attempt = parsed
		}
	}

	return ConversionJob{
		DocumentID:    uint(docID),
		VersionNumber: version,
		InputKey:      inputKey,
		OutputKey:     outputKey,
		Attempt:       attempt,
	}, nil
}
