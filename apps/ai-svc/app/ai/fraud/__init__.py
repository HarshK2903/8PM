"""Fraud detection module init."""
from app.ai.fraud.detector import run_fraud_checks, FraudCheckResult

__all__ = ["run_fraud_checks", "FraudCheckResult"]
