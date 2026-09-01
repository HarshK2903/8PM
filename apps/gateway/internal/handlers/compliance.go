package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/gemverify/gateway/internal/config"
	"github.com/gemverify/gateway/internal/database"
)

type ComplianceHandler struct {
	cfg *config.Config
}

func NewComplianceHandler(cfg *config.Config) *ComplianceHandler {
	return &ComplianceHandler{cfg: cfg}
}

// GetComplianceResult returns the AI compliance result for a bid
func (h *ComplianceHandler) GetComplianceResult(c *fiber.Ctx) error {
	bidID := c.Params("bidId")

	var id uuid.UUID
	var overallScore, eligScore, compScore, riskScore, completeScore, qualityScore float64
	var riskLevel string
	var reqMatches, flags, issues, evidence, reasoning, steps, rawData []byte
	var aiRec, reasonTrace *string
	var pipelineDuration *int64
	var generatedAt time.Time

	err := database.Pool.QueryRow(context.Background(),
		`SELECT id, overall_score, eligibility_score, compliance_score, risk_score,
			completeness_score, quality_score, risk_level,
			requirement_matches, flags, issues, evidence,
			ai_recommendation, reasoning_trace, reasoning_trace_structured,
			pipeline_duration_ms, pipeline_steps_completed, raw_scoring_data, generated_at
		 FROM compliance_results WHERE bid_id = $1`, bidID,
	).Scan(&id, &overallScore, &eligScore, &compScore, &riskScore,
		&completeScore, &qualityScore, &riskLevel,
		&reqMatches, &flags, &issues, &evidence,
		&aiRec, &reasonTrace, &reasoning,
		&pipelineDuration, &steps, &rawData, &generatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "No compliance result found for this bid"})
	}

	return c.JSON(fiber.Map{
		"id":                          id.String(),
		"bid_id":                      bidID,
		"overall_score":               overallScore,
		"eligibility_score":           eligScore,
		"compliance_score":            compScore,
		"risk_score":                  riskScore,
		"completeness_score":          completeScore,
		"quality_score":               qualityScore,
		"risk_level":                  riskLevel,
		"ai_recommendation":           aiRec,
		"reasoning_trace":             reasonTrace,
		"pipeline_duration_ms":        pipelineDuration,
		"generated_at":                generatedAt.Format(time.RFC3339),
	})
}

// GetBidDocuments returns all documents for a bid
func (h *ComplianceHandler) GetBidDocuments(c *fiber.Ctx) error {
	bidID := c.Params("bidId")

	rows, err := database.Pool.Query(context.Background(),
		`SELECT id, doc_type, original_filename, file_size, mime_type,
			verification_status, ocr_confidence, verified_at, uploaded_at
		 FROM documents WHERE bid_id = $1 ORDER BY uploaded_at`, bidID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	docs := []fiber.Map{}
	for rows.Next() {
		var docID uuid.UUID
		var docType, origName string
		var fileSize *int64
		var mimeType, verStatus *string
		var ocrConf *float64
		var verifiedAt *time.Time
		var uploadedAt time.Time

		if err := rows.Scan(&docID, &docType, &origName, &fileSize, &mimeType,
			&verStatus, &ocrConf, &verifiedAt, &uploadedAt); err != nil {
			continue
		}

		doc := fiber.Map{
			"id": docID.String(), "doc_type": docType, "original_filename": origName,
			"file_size": fileSize, "mime_type": mimeType,
			"verification_status": verStatus, "ocr_confidence": ocrConf,
			"uploaded_at": uploadedAt.Format(time.RFC3339),
		}
		if verifiedAt != nil {
			doc["verified_at"] = verifiedAt.Format(time.RFC3339)
		}
		docs = append(docs, doc)
	}

	return c.JSON(fiber.Map{"items": docs, "total": len(docs)})
}

// TriggerPipeline triggers AI compliance pipeline for a bid (placeholder)
func (h *ComplianceHandler) TriggerPipeline(c *fiber.Ctx) error {
	bidID := c.Params("bidId")
	userID, _ := c.Locals("user_id").(string)

	// Update bid status to ai_processing
	_, err := database.Pool.Exec(context.Background(),
		`UPDATE bids SET status = 'ai_processing', updated_at = NOW() WHERE id = $1`, bidID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update bid status"})
	}

	// Audit
	database.Pool.Exec(context.Background(),
		`INSERT INTO audit_trail (user_id, bid_id, action, entity_type, entity_id, description)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		userID, bidID, "pipeline.triggered", "bid", bidID, "AI compliance pipeline triggered")

	log.Info().Str("bid_id", bidID).Msg("AI pipeline triggered (will call gRPC)")

	// TODO: Call AI service via gRPC in goroutine
	// For now, return immediately
	return c.JSON(fiber.Map{
		"message": "AI compliance pipeline triggered",
		"bid_id":  bidID,
		"status":  "ai_processing",
	})
}
