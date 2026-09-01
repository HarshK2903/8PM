package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	ServerHost string
	ServerPort string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// MinIO
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIOUseSSL    bool

	// JWT
	JWTSecret     string
	JWTExpiryMins int

	// AI Service (gRPC)
	AIServiceAddr string

	// Mock Gov API
	MockGovAPIURL string

	// CORS
	CORSOrigins string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		ServerHost:     getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort:     getEnv("SERVER_PORT", "8000"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://gemuser:gempass123@localhost:5432/gemverify?sslmode=disable"),
		RedisURL:       getEnv("REDIS_URL", "redis://localhost:6379/0"),
		MinIOEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinIOSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinIOBucket:    getEnv("MINIO_BUCKET", "gemverify"),
		MinIOUseSSL:    getEnvBool("MINIO_USE_SSL", false),
		JWTSecret:      getEnv("JWT_SECRET", "gemverify-local-dev-secret-key-2024"),
		JWTExpiryMins:  getEnvInt("JWT_EXPIRY_MINUTES", 1440),
		AIServiceAddr:  getEnv("AI_SERVICE_ADDR", "localhost:50051"),
		MockGovAPIURL:  getEnv("MOCK_GOV_API_URL", "http://localhost:8001"),
		CORSOrigins:    getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if val, ok := os.LookupEnv(key); ok {
		if b, err := strconv.ParseBool(val); err == nil {
			return b
		}
	}
	return fallback
}
