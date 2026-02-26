package aws

import (
	"context"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var s3Client *s3.Client

const defaultUploadURLExpiryMinutes = 15
const defaultDownloadURLExpiryMinutes = 60
const defaultUploadTimeoutSeconds = 120

var uploadURLExpiry = time.Duration(defaultUploadURLExpiryMinutes) * time.Minute
var downloadURLExpiry = time.Duration(defaultDownloadURLExpiryMinutes) * time.Minute
var uploadTimeout = time.Duration(defaultUploadTimeoutSeconds) * time.Second

func InitS3Client() {
	log.Println("Initializing S3 client...")
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	s3Client = s3.NewFromConfig(cfg)
	uploadURLExpiry = getEnvDurationMinutes("S3_UPLOAD_URL_EXPIRY_MINUTES", defaultUploadURLExpiryMinutes)
	downloadURLExpiry = getEnvDurationMinutes("S3_DOWNLOAD_URL_EXPIRY_MINUTES", defaultDownloadURLExpiryMinutes)
	uploadTimeout = getEnvDurationSeconds("S3_UPLOAD_TIMEOUT_SECONDS", defaultUploadTimeoutSeconds)

	log.Println("S3 client successfully initialized!")
}

func UploadURLExpiry() time.Duration {
	return uploadURLExpiry
}

func DownloadURLExpiry() time.Duration {
	return downloadURLExpiry
}

func UploadTimeout() time.Duration {
	return uploadTimeout
}

func KeyPrefix() string {
	return s3KeyPrefix()
}

func GetPresignedUrl(fileName string) (string, error) {
	presignedUrlClient := s3.NewPresignClient(s3Client)
	presignedUrl, err := presignedUrlClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("S3_BUCKET")),
		Key:    aws.String(normalizeKey(fileName)),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = downloadURLExpiry
	})
	if err != nil {
		return "", err
	}
	return presignedUrl.URL, nil
}

func CreateUploadPresignedUrl(fileName string, contentType string) (string, error) {
	presignedUrlClient := s3.NewPresignClient(s3Client)
	presignedUrl, err := presignedUrlClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(os.Getenv("S3_BUCKET")),
		Key:         aws.String(normalizeKey(fileName)),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = uploadURLExpiry
	})
	if err != nil {
		return "", err
	}
	return presignedUrl.URL, nil
}

func PutObject(ctx context.Context, key, contentType string, body io.Reader, contentLength int64) error {
	input := &s3.PutObjectInput{
		Bucket:      aws.String(os.Getenv("S3_BUCKET")),
		Key:         aws.String(normalizeKey(key)),
		Body:        body,
		ContentType: aws.String(contentType),
	}
	if contentLength > 0 {
		input.ContentLength = aws.Int64(contentLength)
	}
	_, err := s3Client.PutObject(ctx, input)
	return err
}

type ObjectInfo struct {
	Body          io.ReadCloser
	ContentType   string
	ContentLength int64
}

func GetObject(ctx context.Context, key string) (ObjectInfo, error) {
	out, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("S3_BUCKET")),
		Key:    aws.String(normalizeKey(key)),
	})
	if err != nil {
		return ObjectInfo{}, err
	}
	info := ObjectInfo{Body: out.Body}
	if out.ContentType != nil {
		info.ContentType = *out.ContentType
	}
	if out.ContentLength != nil {
		info.ContentLength = *out.ContentLength
	}
	return info, nil
}

func DeleteObject(ctx context.Context, key string) error {
	_, err := s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(os.Getenv("S3_BUCKET")),
		Key:    aws.String(normalizeKey(key)),
	})
	return err
}

func normalizeKey(key string) string {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		return trimmed
	}
	prefix := s3KeyPrefix()
	if strings.HasPrefix(trimmed, prefix) {
		return trimmed
	}
	return prefix + trimmed
}

func s3KeyPrefix() string {
	prefix := strings.TrimSpace(os.Getenv("S3_KEY_PREFIX"))
	if prefix == "" {
		prefix = "DocDrop/"
	}
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}
	return prefix
}

func getEnvDurationMinutes(key string, fallback int) time.Duration {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return time.Duration(fallback) * time.Minute
	}
	parsed, err := strconv.Atoi(val)
	if err != nil || parsed <= 0 {
		return time.Duration(fallback) * time.Minute
	}
	return time.Duration(parsed) * time.Minute
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
