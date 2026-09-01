package cache

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

var Client *redis.Client

func Connect(redisURL string) error {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	Client = redis.NewClient(opts)

	// Test connection
	if err := Client.Ping(context.Background()).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Info().Msg("✅ Redis connected")
	return nil
}

func Close() {
	if Client != nil {
		Client.Close()
		log.Info().Msg("Redis connection closed")
	}
}
