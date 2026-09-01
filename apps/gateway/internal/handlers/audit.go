package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/gemverify/gateway/internal/config"
	"github.com/gemverify/gateway/internal/database"
)

type AuditHandler struct {
	cfg *config.Config
}

func NewAuditHandler(cfg *config.Config) *AuditHandler {
	return &AuditHandler{cfg: cfg}
}

// ListAuditEntries returns paginated audit trail
func (h *AuditHandler) ListAuditEntries(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("per_page", 50)
	offset := (page - 1) * perPage
	entityType := c.Query("entity_type", "")
	action := c.Query("action", "")

	query := `SELECT a.id, a.user_id, a.tender_id, a.bid_id, a.action, a.entity_type,
			a.entity_id, a.description, a.created_at, COALESCE(u.full_name, 'System') as user_name
			FROM audit_trail a
			LEFT JOIN users u ON a.user_id = u.id
			WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if entityType != "" {
		query += " AND a.entity_type = $" + itoa(argIdx)
		args = append(args, entityType)
		argIdx++
	}
	if action != "" {
		query += " AND a.action = $" + itoa(argIdx)
		args = append(args, action)
		argIdx++
	}

	query += " ORDER BY a.created_at DESC LIMIT $" + itoa(argIdx) + " OFFSET $" + itoa(argIdx+1)
	args = append(args, perPage, offset)

	rows, err := database.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	entries := []fiber.Map{}
	for rows.Next() {
		var id uuid.UUID
		var userID, tenderID, bidID *uuid.UUID
		var actionStr, entityTypeStr string
		var entityID, description *string
		var createdAt time.Time
		var userName string

		if err := rows.Scan(&id, &userID, &tenderID, &bidID, &actionStr, &entityTypeStr,
			&entityID, &description, &createdAt, &userName); err != nil {
			continue
		}

		entry := fiber.Map{
			"id": id.String(), "action": actionStr, "entity_type": entityTypeStr,
			"description": description, "created_at": createdAt.Format(time.RFC3339),
			"user_name": userName,
		}
		if userID != nil { entry["user_id"] = userID.String() }
		if tenderID != nil { entry["tender_id"] = tenderID.String() }
		if bidID != nil { entry["bid_id"] = bidID.String() }
		if entityID != nil { entry["entity_id"] = *entityID }
		entries = append(entries, entry)
	}

	return c.JSON(fiber.Map{"items": entries, "total": len(entries), "page": page, "per_page": perPage})
}

func itoa(i int) string {
	s := ""
	if i == 0 { return "0" }
	for i > 0 {
		s = string(rune('0'+i%10)) + s
		i /= 10
	}
	return s
}
