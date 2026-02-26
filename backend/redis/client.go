package redis

import (
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type Settings struct {
	Addr     string
	Password string
	DB       int
	Stream   string
	StreamMaxLen int64
	Group    string
	Consumer string
	Block    time.Duration
}

var (
	client     *goredis.Client
	settings   Settings
	initOnce   sync.Once
)

func LoadSettings() Settings {
	return Settings{
		Addr:     getEnvString("REDIS_ADDR", "localhost:6379"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       getEnvInt("REDIS_DB", 0),
		Stream:   getEnvString("REDIS_STREAM", "docdrop:conversion:stream"),
		StreamMaxLen: getEnvInt64("REDIS_STREAM_MAXLEN", 10000),
		Group:    getEnvString("REDIS_GROUP", "docdrop:conversion:workers"),
		Consumer: getEnvString("REDIS_CONSUMER", "api"),
		Block:    getEnvDurationSeconds("REDIS_BLOCK_SECONDS", 5),
	}
}

func Client() (*goredis.Client, Settings, error) {
	initOnce.Do(func() {
		settings = LoadSettings()
		client = goredis.NewClient(&goredis.Options{
			Addr:     settings.Addr,
			Password: settings.Password,
			DB:       settings.DB,
		})
	})
	return client, settings, nil
}

func getEnvString(key, fallback string) string {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	return val
}

func getEnvInt(key string, fallback int) int {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvDurationSeconds(key string, fallback int) time.Duration {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return time.Duration(fallback) * time.Second
	}
	parsed, err := strconv.Atoi(val)
	if err != nil || parsed <= 0 {
		return time.Duration(fallback) * time.Second
	}
	return time.Duration(parsed) * time.Second
}

func getEnvInt64(key string, fallback int64) int64 {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(val, 10, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
