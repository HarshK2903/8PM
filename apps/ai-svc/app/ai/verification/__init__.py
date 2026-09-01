"""Verification module init."""
from app.ai.verification.orchestrator import verify_document, verify_all_documents, VerificationResult

__all__ = ["verify_document", "verify_all_documents", "VerificationResult"]
