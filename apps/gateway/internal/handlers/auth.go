package handlers

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"

	"github.com/gemverify/gateway/internal/config"
	"github.com/gemverify/gateway/internal/database"
	"github.com/gemverify/gateway/internal/middleware"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

// --- Request/Response types ---

type RegisterRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	Organization string `json:"organization,omitempty"`
	Phone        string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken string      `json:"access_token"`
	TokenType   string      `json:"token_type"`
	User        UserPayload `json:"user"`
}

type UserPayload struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	Organization string `json:"organization,omitempty"`
}

// Register creates a new user account
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate
	if req.Email == "" || req.Password == "" || req.FullName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email, password, and full_name are required"})
	}
	if req.Role == "" {
		req.Role = "bidder"
	}
	if req.Role != "bidder" && req.Role != "officer" && req.Role != "admin" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Role must be 'bidder', 'officer', or 'admin'"})
	}

	// Check existing
	var exists bool
	err := database.Pool.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", strings.ToLower(req.Email),
	).Scan(&exists)
	if err != nil {
		log.Error().Err(err).Msg("Database error checking user")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	if exists {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already registered"})
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Insert user
	userID := uuid.New()
	_, err = database.Pool.Exec(context.Background(),
		`INSERT INTO users (id, email, password_hash, full_name, role, organization, phone)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, strings.ToLower(req.Email), string(hash), req.FullName, req.Role, req.Organization, req.Phone,
	)
	if err != nil {
		log.Error().Err(err).Msg("Failed to insert user")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user"})
	}

	// Generate token
	token, err := middleware.GenerateToken(userID.String(), req.Role, h.cfg)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(fiber.StatusCreated).JSON(TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User: UserPayload{
			ID:           userID.String(),
			Email:        strings.ToLower(req.Email),
			FullName:     req.FullName,
			Role:         req.Role,
			Organization: req.Organization,
		},
	})
}

// Login authenticates a user
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	// Find user
	var userID, passwordHash, fullName, role, organization string
	var isActive bool
	err := database.Pool.QueryRow(context.Background(),
		`SELECT id, password_hash, full_name, role, COALESCE(organization, ''), is_active
		 FROM users WHERE email = $1`, strings.ToLower(req.Email),
	).Scan(&userID, &passwordHash, &fullName, &role, &organization, &isActive)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	if !isActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Account is deactivated"})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	// Generate token
	token, err := middleware.GenerateToken(userID, role, h.cfg)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User: UserPayload{
			ID:           userID,
			Email:        strings.ToLower(req.Email),
			FullName:     fullName,
			Role:         role,
			Organization: organization,
		},
	})
}

// GetMe returns the current authenticated user
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)

	var email, fullName, role, organization, phone string
	var isActive bool
	var createdAt string
	err := database.Pool.QueryRow(context.Background(),
		`SELECT email, full_name, role, COALESCE(organization, ''), COALESCE(phone, ''), is_active, created_at::text
		 FROM users WHERE id = $1`, userID,
	).Scan(&email, &fullName, &role, &organization, &phone, &isActive, &createdAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"id":           userID,
		"email":        email,
		"full_name":    fullName,
		"role":         role,
		"organization": organization,
		"phone":        phone,
		"is_active":    isActive,
		"created_at":   createdAt,
	})
}
