package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/rs/zerolog/log"
)

var Client *minio.Client
var BucketName string

func Connect(endpoint, accessKey, secretKey, bucket string, useSSL bool) error {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to MinIO: %w", err)
	}

	Client = client
	BucketName = bucket

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Info().Str("bucket", bucket).Msg("Created MinIO bucket")
	}

	log.Info().Str("endpoint", endpoint).Str("bucket", bucket).Msg("✅ MinIO connected")
	return nil
}

// UploadFile uploads a file to MinIO and returns the object path
func UploadFile(ctx context.Context, objectName string, reader io.Reader, fileSize int64, contentType string) (string, error) {
	_, err := Client.PutObject(ctx, BucketName, objectName, reader, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	return objectName, nil
}

// DownloadFile retrieves a file from MinIO
func DownloadFile(ctx context.Context, objectName string) (*minio.Object, error) {
	obj, err := Client.GetObject(ctx, BucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file: %w", err)
	}
	return obj, nil
}

// DeleteFile removes a file from MinIO
func DeleteFile(ctx context.Context, objectName string) error {
	return Client.RemoveObject(ctx, BucketName, objectName, minio.RemoveObjectOptions{})
}

// GetPresignedURL generates a temporary download URL
func GetPresignedURL(ctx context.Context, objectName string) (string, error) {
	url, err := Client.PresignedGetObject(ctx, BucketName, objectName, 3600*1000000000, nil) // 1 hour
	if err != nil {
		return "", err
	}
	return url.String(), nil
}
