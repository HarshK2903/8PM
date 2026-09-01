"""
Multi-Dimensional Compliance Scorer

Produces 6 sub-scores and an overall score:
  - Eligibility Score: Are statutory requirements met?
  - Compliance Score: Are all documents valid and verified?
  - Risk Score: How risky is this bidder? (inverse — lower = riskier)
  - Completeness Score: Were all required documents submitted?
  - Quality Score: How confident are we in the extracted data?
  - Overall Score: Weighted aggregate

Also classifies risk level: low / medium / high / critical
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("ai-svc.scoring")

# Scoring weights
WEIGHTS = {
    "eligibility": 0.30,
    "compliance": 0.25,
    "risk": 0.15,
    "completeness": 0.20,
    "quality": 0.10,
}


class ComplianceScores:
    def __init__(self):
        self.overall = 0.0
        self.eligibility = 0.0
        self.compliance = 0.0
        self.risk = 0.0
        self.completeness = 0.0
        self.quality = 0.0
        self.risk_level = "medium"
        self.flags: List[Dict] = []
        self.issues: List[Dict] = []

    def to_dict(self) -> dict:
        return {
            "overall": round(self.overall, 2),
            "eligibility": round(self.eligibility, 2),
            "compliance": round(self.compliance, 2),
            "risk": round(self.risk, 2),
            "completeness": round(self.completeness, 2),
            "quality": round(self.quality, 2),
            "risk_level": self.risk_level,
            "flags": self.flags,
            "issues": self.issues,
        }


def compute_scores(
    requirement_matches: List[Any],
    verification_results: Dict[str, Any],
    extracted_data: Dict[str, Dict[str, str]],
    tender_requirements: Dict[str, Any],
) -> ComplianceScores:
    """
    Compute all compliance scores based on matching and verification results.
    """
    scores = ComplianceScores()

    # --- 1. Eligibility Score ---
    scores.eligibility = _compute_eligibility(requirement_matches, scores)

    # --- 2. Compliance Score ---
    scores.compliance = _compute_compliance(verification_results, scores)

    # --- 3. Risk Score ---
    scores.risk = _compute_risk(verification_results, requirement_matches, scores)

    # --- 4. Completeness Score ---
    scores.completeness = _compute_completeness(
        verification_results, tender_requirements, scores
    )

    # --- 5. Quality Score ---
    scores.quality = _compute_quality(extracted_data, scores)

    # --- 6. Overall Score (weighted) ---
    scores.overall = (
        scores.eligibility * WEIGHTS["eligibility"]
        + scores.compliance * WEIGHTS["compliance"]
        + scores.risk * WEIGHTS["risk"]
        + scores.completeness * WEIGHTS["completeness"]
        + scores.quality * WEIGHTS["quality"]
    )

    # --- Risk Level Classification ---
    scores.risk_level = _classify_risk(scores)

    logger.info(
        f"Scores computed: overall={scores.overall:.1f} "
        f"eligibility={scores.eligibility:.1f} compliance={scores.compliance:.1f} "
        f"risk={scores.risk:.1f} completeness={scores.completeness:.1f} "
        f"quality={scores.quality:.1f} risk_level={scores.risk_level}"
    )

    return scores


def _compute_eligibility(matches: List[Any], scores: ComplianceScores) -> float:
    """Score based on how many requirements are met."""
    if not matches:
        return 50.0

    met = sum(1 for m in matches if m.status == "met")
    partial = sum(1 for m in matches if m.status == "partial")
    total = len(matches)

    # Check for critical failures
    for m in matches:
        if m.status == "unmet" and m.requirement_id == "blacklist_check":
            scores.flags.append({
                "type": "critical",
                "message": "Bidder found in debarment/blacklist database",
                "field": "blacklist",
                "recommendation": "Immediate disqualification recommended",
            })
            return 0.0  # Automatic zero

    score = ((met * 1.0 + partial * 0.5) / total) * 100 if total > 0 else 0

    # Flag unmet mandatory requirements
    for m in matches:
        if m.status == "unmet":
            scores.issues.append({
                "severity": "high",
                "description": f"Requirement not met: {m.requirement_text}",
                "recommendation": m.evidence_summary,
                "related_doc": m.source_document or "",
            })
        elif m.status == "partial":
            scores.flags.append({
                "type": "warning",
                "message": f"Partial match: {m.requirement_text}",
                "field": m.requirement_id,
                "recommendation": m.evidence_summary,
            })

    return min(score, 100.0)


def _compute_compliance(verification_results: Dict, scores: ComplianceScores) -> float:
    """Score based on document verification outcomes."""
    if not verification_results:
        return 0.0

    status_scores = {
        "verified": 100,
        "mismatch": 40,
        "expired": 20,
        "not_found": 10,
        "failed": 0,
        "pending": 50,
    }

    total_score = 0
    count = 0

    for doc_type, result in verification_results.items():
        status = result.get("status", "failed") if isinstance(result, dict) else getattr(result, "status", "failed")
        doc_score = status_scores.get(status, 0)
        total_score += doc_score
        count += 1

        # Flag mismatches
        mismatches = result.get("mismatches", []) if isinstance(result, dict) else getattr(result, "mismatches", [])
        for mismatch in mismatches:
            scores.flags.append({
                "type": "warning",
                "message": mismatch,
                "field": doc_type,
                "recommendation": f"Verify {doc_type} data manually",
            })

        # Flag failures
        if status in ("failed", "not_found"):
            scores.issues.append({
                "severity": "medium",
                "description": f"{doc_type.upper()} verification {status}",
                "recommendation": f"Request bidder to resubmit {doc_type} document",
                "related_doc": doc_type,
            })

    return (total_score / count) if count > 0 else 0.0


def _compute_risk(verification_results: Dict, matches: List, scores: ComplianceScores) -> float:
    """
    Compute risk score (higher = LOWER risk, counterintuitive but consistent).
    Factors: verification failures, mismatches, unmet requirements.
    """
    risk_deductions = 0

    # Deduct for each failed verification
    for doc_type, result in verification_results.items():
        status = result.get("status", "failed") if isinstance(result, dict) else getattr(result, "status", "failed")
        if status == "failed":
            risk_deductions += 15
        elif status == "mismatch":
            risk_deductions += 10
        elif status == "not_found":
            risk_deductions += 12
        elif status == "expired":
            risk_deductions += 8

    # Deduct for unmet requirements
    for m in matches:
        if m.status == "unmet":
            risk_deductions += 10
        elif m.status == "partial":
            risk_deductions += 5

    score = max(0, 100 - risk_deductions)

    if risk_deductions > 40:
        scores.flags.append({
            "type": "critical",
            "message": f"High risk score — {risk_deductions} risk points accumulated",
            "field": "risk_assessment",
            "recommendation": "Thorough manual review recommended before approval",
        })

    return score


def _compute_completeness(
    verification_results: Dict, tender_requirements: Dict, scores: ComplianceScores
) -> float:
    """Score based on how many required documents were submitted."""
    required_docs = tender_requirements.get("required_documents", [])
    if not required_docs:
        return 100.0

    submitted = 0
    for doc_type in required_docs:
        if doc_type in verification_results:
            submitted += 1
        else:
            scores.issues.append({
                "severity": "high",
                "description": f"Required document missing: {doc_type.upper()}",
                "recommendation": f"Request {doc_type} document from bidder",
                "related_doc": doc_type,
            })

    return (submitted / len(required_docs)) * 100


def _compute_quality(extracted_data: Dict, scores: ComplianceScores) -> float:
    """Score based on OCR extraction confidence and data completeness."""
    if not extracted_data:
        return 50.0

    quality_scores = []
    for doc_type, fields in extracted_data.items():
        if isinstance(fields, dict):
            field_count = len(fields)
            # More extracted fields = higher quality
            quality = min(100, field_count * 25)
            quality_scores.append(quality)

            if field_count < 2:
                scores.flags.append({
                    "type": "info",
                    "message": f"Low data extraction from {doc_type} — only {field_count} field(s) extracted",
                    "field": doc_type,
                    "recommendation": "Consider requesting a clearer document scan",
                })

    return sum(quality_scores) / len(quality_scores) if quality_scores else 50.0


def _classify_risk(scores: ComplianceScores) -> str:
    """Classify risk level based on overall and risk scores."""
    critical_flags = sum(1 for f in scores.flags if f["type"] == "critical")

    if critical_flags > 0 or scores.overall < 30:
        return "critical"
    elif scores.overall < 50 or scores.risk < 40:
        return "high"
    elif scores.overall < 70 or scores.risk < 60:
        return "medium"
    else:
        return "low"
