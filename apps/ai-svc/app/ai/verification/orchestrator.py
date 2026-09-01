"""
Verification Orchestrator

Runs parallel verification calls against mock government APIs.
Each verifier checks extracted document data against the mock registry.
Designed to be swappable with real API integrations.
"""

import asyncio
import logging
import time
from typing import Dict, List, Tuple, Optional

import httpx

logger = logging.getLogger("ai-svc.verification")

MOCK_API_BASE = "http://localhost:8001/api/registry"


class VerificationResult:
    def __init__(self, doc_type: str, status: str, registry_data: dict = None,
                 mismatches: list = None, errors: list = None):
        self.doc_type = doc_type
        self.status = status  # verified | failed | mismatch | not_found | expired
        self.registry_data = registry_data or {}
        self.mismatches = mismatches or []
        self.errors = errors or []
        self.verified_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


async def verify_document(
    doc_type: str,
    extracted_data: Dict[str, str],
    registration_number: str,
) -> VerificationResult:
    """
    Verify a single document against the mock government registry.
    """
    verifiers = {
        "udyam": _verify_udyam,
        "gst": _verify_gst,
        "pan": _verify_pan,
        "income_tax": _verify_income_tax,
        "epfo": _verify_epfo,
        "esic": _verify_esic,
        "startup_certificate": _verify_startup,
        "nsic": _verify_nsic,
        "company_registration": _verify_mca21,
        "oem_authorization": _verify_oem,
        "make_in_india": _verify_make_in_india,
    }

    verifier = verifiers.get(doc_type, _verify_generic)

    try:
        result = await verifier(doc_type, extracted_data, registration_number)
        logger.info(f"Verification [{doc_type}] → {result.status} (reg: {registration_number})")
        return result
    except Exception as e:
        logger.error(f"Verification [{doc_type}] failed: {e}")
        return VerificationResult(
            doc_type=doc_type,
            status="failed",
            errors=[str(e)]
        )


async def verify_all_documents(
    documents: List[Dict],
) -> Dict[str, VerificationResult]:
    """
    Run verification for all documents in parallel.
    Returns a dict of doc_type -> VerificationResult.
    """
    tasks = []
    for doc in documents:
        reg_number = _get_registration_number(doc["doc_type"], doc.get("extracted_data", {}))
        tasks.append(verify_document(
            doc_type=doc["doc_type"],
            extracted_data=doc.get("extracted_data", {}),
            registration_number=reg_number,
        ))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    output = {}
    for doc, result in zip(documents, results):
        if isinstance(result, Exception):
            output[doc["doc_type"]] = VerificationResult(
                doc_type=doc["doc_type"],
                status="failed",
                errors=[str(result)]
            )
        else:
            output[doc["doc_type"]] = result

    return output


# ============================================
# Individual Verifiers
# ============================================

async def _query_registry(registry_type: str, registration_number: str) -> Optional[dict]:
    """Query the mock government API."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{MOCK_API_BASE}/{registry_type}/{registration_number}"
            )
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                return None
            else:
                logger.warning(f"Registry query [{registry_type}] returned {resp.status_code}")
                return None
        except httpx.RequestError as e:
            logger.error(f"Registry query [{registry_type}] error: {e}")
            return None


async def _verify_udyam(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("udyam", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")

    mismatches = []
    reg_data = registry.get("data", {})

    # Cross-check enterprise name
    if extracted.get("enterprise_name") and reg_data.get("enterprise_name"):
        if extracted["enterprise_name"].lower() != reg_data["enterprise_name"].lower():
            mismatches.append(f"Enterprise name mismatch: doc='{extracted['enterprise_name']}' vs registry='{reg_data['enterprise_name']}'")

    # Check if active
    if not registry.get("is_active", True):
        return VerificationResult(doc_type, "expired", reg_data, mismatches)

    status = "mismatch" if mismatches else "verified"
    return VerificationResult(doc_type, status, reg_data, mismatches)


async def _verify_gst(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("gstn", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")

    mismatches = []
    reg_data = registry.get("data", {})

    if reg_data.get("status", "").lower() != "active":
        return VerificationResult(doc_type, "expired", reg_data)

    # Check return filing compliance
    if reg_data.get("return_filing_status", "").lower() == "defaulter":
        mismatches.append("GST return filing status: defaulter")

    status = "mismatch" if mismatches else "verified"
    return VerificationResult(doc_type, status, reg_data, mismatches)


async def _verify_pan(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("pan", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")

    reg_data = registry.get("data", {})
    mismatches = []

    if extracted.get("name") and reg_data.get("name"):
        if extracted["name"].lower() != reg_data["name"].lower():
            mismatches.append(f"Name mismatch on PAN")

    status = "mismatch" if mismatches else "verified"
    return VerificationResult(doc_type, status, reg_data, mismatches)


async def _verify_income_tax(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("pan", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")
    return VerificationResult(doc_type, "verified", registry.get("data", {}))


async def _verify_epfo(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("epfo", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")

    reg_data = registry.get("data", {})
    mismatches = []
    if reg_data.get("compliance_status", "").lower() == "defaulter":
        mismatches.append("EPFO compliance status: defaulter")

    status = "mismatch" if mismatches else "verified"
    return VerificationResult(doc_type, status, reg_data, mismatches)


async def _verify_esic(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("esic", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")
    return VerificationResult(doc_type, "verified", registry.get("data", {}))


async def _verify_startup(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("startup", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")
    return VerificationResult(doc_type, "verified", registry.get("data", {}))


async def _verify_nsic(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("nsic", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")
    return VerificationResult(doc_type, "verified", registry.get("data", {}))


async def _verify_mca21(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    registry = await _query_registry("mca21", reg_number)
    if not registry:
        return VerificationResult(doc_type, "not_found")

    reg_data = registry.get("data", {})
    mismatches = []
    if reg_data.get("company_status", "").lower() not in ("active", "active-compliant"):
        mismatches.append(f"Company status: {reg_data.get('company_status', 'unknown')}")

    status = "mismatch" if mismatches else "verified"
    return VerificationResult(doc_type, status, reg_data, mismatches)


async def _verify_oem(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    # OEM authorization doesn't have a government registry — just validate format
    if extracted.get("authorizing_oem") and extracted.get("valid_until"):
        return VerificationResult(doc_type, "verified", extracted)
    return VerificationResult(doc_type, "failed", errors=["Incomplete OEM authorization data"])


async def _verify_make_in_india(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    # Self-declaration — validate that percentage is present
    if extracted.get("local_content_percentage"):
        return VerificationResult(doc_type, "verified", extracted)
    return VerificationResult(doc_type, "failed", errors=["Local content percentage not found"])


async def _verify_generic(doc_type: str, extracted: dict, reg_number: str) -> VerificationResult:
    return VerificationResult(doc_type, "verified", extracted)


# ============================================
# Helpers
# ============================================

def _get_registration_number(doc_type: str, extracted: dict) -> str:
    """Extract the registration number based on document type."""
    mapping = {
        "udyam": "udyam_number",
        "gst": "gstin",
        "pan": "pan_number",
        "income_tax": "pan_number",
        "epfo": "establishment_code",
        "esic": "esic_code",
        "startup_certificate": "certificate_number",
        "nsic": "nsic_number",
        "company_registration": "cin",
        "oem_authorization": "authorizing_oem",
        "make_in_india": "local_content_percentage",
    }
    key = mapping.get(doc_type, "registration_number")
    return extracted.get(key, "UNKNOWN")
