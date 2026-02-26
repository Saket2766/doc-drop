package main

import (
	"context"
	"docdrop-backend/aws"
	"docdrop-backend/database"
	"docdrop-backend/models"
	"docdrop-backend/redis"
	"docdrop-backend/services"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	goredis "github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	aws.InitS3Client()
	database.ConnectToDatabase()

	ctx := context.Background()
	if err := redis.EnsureStreamAndGroup(ctx); err != nil {
		log.Fatalf("conversion-worker: ensure stream/group failed: %v", err)
	}

	workerCount := getEnvInt("CONVERSION_WORKERS", 2)
	consumerBase := strings.TrimSpace(os.Getenv("REDIS_CONSUMER"))
	if consumerBase == "" {
		consumerBase = fmt.Sprintf("worker-%d", os.Getpid())
	}

	var wg sync.WaitGroup
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		consumer := fmt.Sprintf("%s-%d", consumerBase, i)
		go func() {
			defer wg.Done()
			workerLoop(ctx, consumer)
		}()
	}

	wg.Wait()
}

func workerLoop(ctx context.Context, consumer string) {
	block := getEnvDurationSeconds("REDIS_BLOCK_SECONDS", 5)
	for {
		messages, err := redis.ReadJobs(ctx, 1, block, consumer)
		if err != nil {
			log.Printf("worker %s: read jobs failed: %v", consumer, err)
			time.Sleep(2 * time.Second)
			continue
		}
		if len(messages) == 0 {
			continue
		}
		for _, msg := range messages {
			if err := handleMessage(ctx, msg); err != nil {
				log.Printf("worker %s: job %s failed: %v", consumer, msg.ID, err)
			}
		}
	}
}

func handleMessage(ctx context.Context, msg goredis.XMessage) error {
	job, err := redis.ParseConversionJob(msg)
	if err != nil {
		_ = redis.Ack(ctx, msg.ID)
		return err
	}

	err = processJob(ctx, job)
	if err != nil {
		log.Printf("job %d v%d: %v", job.DocumentID, job.VersionNumber, err)
	}

	if ackErr := redis.Ack(ctx, msg.ID); ackErr != nil {
		return fmt.Errorf("ack failed: %w", ackErr)
	}
	return err
}

func processJob(ctx context.Context, job redis.ConversionJob) error {
	version, err := database.GetVersionByDocumentAndNumber(job.DocumentID, job.VersionNumber)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return markFailure(ctx, job, 0, fmt.Errorf("document version not found"))
		}
		return markFailure(ctx, job, 0, err)
	}

	if version.ConversionStatus == models.ConversionStatusSucceeded {
		return nil
	}

	inputKey := strings.TrimSpace(job.InputKey)
	if inputKey == "" {
		resolved := strings.TrimSpace(version.FileKey)
		if resolved == "" {
			return fmt.Errorf("missing input key")
		}
		inputKey = resolved
	}

	outputKey := strings.TrimSpace(job.OutputKey)
	if outputKey == "" {
		outputKey = services.ComputePdfKey(inputKey)
	}

	attempt := version.ConversionAttempts + 1
	updateErr := database.UpdateDocumentVersionFields(job.DocumentID, job.VersionNumber, map[string]interface{}{
		"conversion_status":   models.ConversionStatusProcessing,
		"conversion_error":    nil,
		"conversion_attempts": attempt,
		"pdf_key":             outputKey,
	})
	if updateErr != nil {
		return updateErr
	}
	_ = redis.PublishConversionUpdate(ctx, redis.ConversionUpdate{
		DocumentID:    job.DocumentID,
		VersionNumber: job.VersionNumber,
		Status:        string(models.ConversionStatusProcessing),
		PdfURL:        &outputKey,
		Attempts:      attempt,
	})

	if err := runConversion(ctx, job.DocumentID, job.VersionNumber, inputKey, outputKey); err != nil {
		return markFailure(ctx, job, attempt, err)
	}

	now := time.Now()
	if err := database.UpdateDocumentVersionFields(job.DocumentID, job.VersionNumber, map[string]interface{}{
		"conversion_status": models.ConversionStatusSucceeded,
		"conversion_error":  nil,
		"converted_at":      now,
		"pdf_key":           outputKey,
	}); err != nil {
		return err
	}
	_ = redis.PublishConversionUpdate(ctx, redis.ConversionUpdate{
		DocumentID:    job.DocumentID,
		VersionNumber: job.VersionNumber,
		Status:        string(models.ConversionStatusSucceeded),
		PdfURL:        &outputKey,
		ConvertedAt:   &now,
		Attempts:      attempt,
	})
	return nil
}

func runConversion(ctx context.Context, documentID uint, versionNumber int, inputKey, outputKey string) error {
	tempRoot := getEnvString("CONVERSION_TEMP_DIR", os.TempDir())
	if err := os.MkdirAll(tempRoot, 0o755); err != nil {
		return err
	}
	workDir, err := os.MkdirTemp(tempRoot, "docdrop-convert-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(workDir)

	inputPath := filepath.Join(workDir, filepath.Base(inputKey))

	obj, err := aws.GetObject(ctx, inputKey)
	if err != nil {
		return err
	}
	defer obj.Body.Close()

	if err := writeToFile(inputPath, obj.Body); err != nil {
		return err
	}

	outputPath, err := convertWithLibreOffice(ctx, inputPath, workDir)
	if err != nil {
		return err
	}

	pdfFile, err := os.Open(outputPath)
	if err != nil {
		return err
	}
	defer pdfFile.Close()

	stat, err := pdfFile.Stat()
	if err != nil {
		return err
	}

	if err := aws.PutObject(ctx, outputKey, "application/pdf", pdfFile, stat.Size()); err != nil {
		return err
	}

	log.Printf("converted document %d version %d to %s", documentID, versionNumber, outputKey)
	return nil
}

func convertWithLibreOffice(ctx context.Context, inputPath, outputDir string) (string, error) {
	libreOffice := getEnvString("LIBREOFFICE_BIN", "soffice")
	timeout := getEnvDurationSeconds("CONVERSION_TIMEOUT_SECONDS", 180)

	cmdCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(cmdCtx, libreOffice,
		"--headless",
		"--nologo",
		"--nolockcheck",
		"--norestore",
		"--convert-to",
		"pdf",
		"--outdir",
		outputDir,
		inputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("libreoffice failed: %w: %s", err, strings.TrimSpace(string(output)))
	}

	base := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	outputPath := filepath.Join(outputDir, base+".pdf")
	if _, err := os.Stat(outputPath); err == nil {
		return outputPath, nil
	}

	fallback, err := findFirstPDF(outputDir)
	if err != nil {
		return "", err
	}
	return fallback, nil
}

func findFirstPDF(dir string) (string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if strings.HasSuffix(strings.ToLower(entry.Name()), ".pdf") {
			return filepath.Join(dir, entry.Name()), nil
		}
	}
	return "", fmt.Errorf("pdf output not found")
}

func writeToFile(path string, reader io.Reader) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(file, reader)
	return err
}

func markFailure(ctx context.Context, job redis.ConversionJob, attempt int, err error) error {
	maxRetries := getEnvInt("CONVERSION_MAX_RETRIES", 3)
	status := models.ConversionStatusFailed
	if attempt < maxRetries {
		status = models.ConversionStatusPending
	}

	errMessage := strings.TrimSpace(err.Error())
	updateErr := database.UpdateDocumentVersionFields(job.DocumentID, job.VersionNumber, map[string]interface{}{
		"conversion_status": status,
		"conversion_error":  errMessage,
	})
	if updateErr != nil {
		return updateErr
	}
	pdfKey := strings.TrimSpace(job.OutputKey)
	if pdfKey == "" && strings.TrimSpace(job.InputKey) != "" {
		pdfKey = services.ComputePdfKey(job.InputKey)
	}
	update := redis.ConversionUpdate{
		DocumentID:    job.DocumentID,
		VersionNumber: job.VersionNumber,
		Status:        string(status),
		Attempts:      attempt,
	}
	if pdfKey != "" {
		update.PdfURL = &pdfKey
	}
	if errMessage != "" {
		update.Error = &errMessage
	}
	_ = redis.PublishConversionUpdate(ctx, update)

	if attempt < maxRetries {
		requeue := redis.ConversionJob{
			DocumentID:    job.DocumentID,
			VersionNumber: job.VersionNumber,
			InputKey:      job.InputKey,
			OutputKey:     job.OutputKey,
			Attempt:       attempt,
		}
		return redis.EnqueueConversion(ctx, requeue)
	}
	return nil
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
