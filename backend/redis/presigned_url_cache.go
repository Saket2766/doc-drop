package redis

import (
	"context"
	"docdrop-backend/aws"
	"encoding/json"
	"log"
	"strings"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

const presignedDownloadCachePrefix = "docdrop:presigned:download:"

type cachedDownloadURL struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
}

func cacheKeyForDownload(key string) string {
	return presignedDownloadCachePrefix + key
}

func getCachedDownloadURL(key string) (string, time.Time, bool) {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		return "", time.Time{}, false
	}
	client, _, err := Client()
	if err != nil || client == nil {
		return "", time.Time{}, false
	}
	ctx := context.Background()
	val, err := client.Get(ctx, cacheKeyForDownload(trimmed)).Result()
	if err != nil {
		if err == goredis.Nil {
			return "", time.Time{}, false
		}
		return "", time.Time{}, false
	}

	var entry cachedDownloadURL
	if err := json.Unmarshal([]byte(val), &entry); err != nil {
		_ = client.Del(ctx, cacheKeyForDownload(trimmed)).Err()
		return "", time.Time{}, false
	}
	if entry.URL == "" || entry.ExpiresAt.IsZero() {
		_ = client.Del(ctx, cacheKeyForDownload(trimmed)).Err()
		return "", time.Time{}, false
	}
	if time.Now().After(entry.ExpiresAt.Add(-1 * time.Minute)) {
		_ = client.Del(ctx, cacheKeyForDownload(trimmed)).Err()
		return "", time.Time{}, false
	}
	return entry.URL, entry.ExpiresAt, true
}

func setCachedDownloadURL(key, url string, expiresAt time.Time) {
	trimmedKey := strings.TrimSpace(key)
	trimmedURL := strings.TrimSpace(url)
	if trimmedKey == "" || trimmedURL == "" || expiresAt.IsZero() {
		return
	}
	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		return
	}
	client, _, err := Client()
	if err != nil || client == nil {
		return
	}
	entry := cachedDownloadURL{
		URL:       trimmedURL,
		ExpiresAt: expiresAt,
	}
	payload, err := json.Marshal(entry)
	if err != nil {
		return
	}
	ctx := context.Background()
	_ = client.Set(ctx, cacheKeyForDownload(trimmedKey), payload, ttl).Err()
}

func getDownloadURL(key string) (string, time.Time, error) {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		return "", time.Time{}, nil
	}
	if url, expiresAt, ok := getCachedDownloadURL(trimmed); ok {
		return url, expiresAt, nil
	}
	url, err := aws.GetPresignedUrl(trimmed)
	if err != nil {
		log.Printf("GetPresignedUrl failed: %v", err)
		return "", time.Time{}, err
	}
	expiresAt := time.Now().Add(aws.DownloadURLExpiry())
	setCachedDownloadURL(trimmed, url, expiresAt)
	return url, expiresAt, nil
}

// GetDownloadURLForKey returns a presigned download URL for the given S3 key.
func GetDownloadURLForKey(key string) (string, time.Time, error) {
	return getDownloadURL(key)
}
