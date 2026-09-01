"""
AI Recommendation Engine — Groq / Llama 3

Generates:
  1. AI recommendation (approve/reject/clarify with reasoning)
  2. Structured reasoning trace
  3. Risk-level justification

Uses Groq's free API with Llama 3 70B for high-quality reasoning.
"""

import json
import logging
import os
from typing import Dict, List, Any, Tuple

logger = logging.getLogger("ai-svc.rag")

# Attempt Groq import
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("groq package not installed — using fallback recommendations")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def generate_recommendation(
    scores: Dict[str, Any],
    requirement_matches: List[Dict],
    flags: List[Dict],
    issues: List[Dict],
    evidence: Dict[str, Any],
    tender_info: Dict[str, Any],
    department: str = "",
) -> Tuple[str, str, Dict]:
    """
    Generate AI recommendation and reasoning trace.

    Returns:
        (recommendation_text, reasoning_trace_text, reasoning_structured)
    """
    if not GROQ_AVAILABLE or not GROQ_API_KEY:
        return _fallback_recommendation(scores, requirement_matches, flags, issues)

    try:
        client = Groq(api_key=GROQ_API_KEY)

        prompt = _build_prompt(scores, requirement_matches, flags, issues, evidence, tender_info, department)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI compliance analyst for the Government e-Marketplace (GeM) "
                        "procurement system in India. You analyze bid compliance data and provide precise, "
                        "structured recommendations to procurement officers.\n\n"
                        "Your analysis must reference specific GFR 2017 rules, GeM GTC clauses, or CVC "
                        "guidelines where applicable. Be authoritative but balanced. Always present evidence "
                        "for your conclusions.\n\n"
                        "Output your response in the following JSON format:\n"
                        '{"recommendation": "APPROVE|REJECT|CLARIFICATION_NEEDED",'
                        '"summary": "2-3 sentence executive summary",'
                        '"detailed_reasoning": "Detailed multi-paragraph reasoning with citations",'
                        '"key_findings": ["finding 1", "finding 2", ...],'
                        '"risk_factors": ["risk 1", "risk 2", ...],'
                        '"missing_items": ["item 1", "item 2", ...],'
                        '"confidence": 0.0-1.0}'
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        result = json.loads(result_text)

        recommendation = _format_recommendation(result)
        reasoning_trace = _format_reasoning_trace(result)
        reasoning_structured = {
            "steps": [
                {
                    "step_name": "AI Analysis",
                    "input_summary": f"Scores: {scores.get('overall', 0):.1f}, {len(flags)} flags, {len(issues)} issues",
                    "output_summary": result.get("summary", ""),
                    "confidence": result.get("confidence", 0.7),
                    "duration_ms": 0,
                },
            ],
            "recommendation": result.get("recommendation", "CLARIFICATION_NEEDED"),
            "key_findings": result.get("key_findings", []),
            "risk_factors": result.get("risk_factors", []),
            "missing_items": result.get("missing_items", []),
        }

        logger.info(f"AI recommendation generated: {result.get('recommendation', 'N/A')}")
        return recommendation, reasoning_trace, reasoning_structured

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return _fallback_recommendation(scores, requirement_matches, flags, issues)


def _build_prompt(scores, matches, flags, issues, evidence, tender_info, department):
    """Build the analysis prompt for the LLM."""
    met = sum(1 for m in matches if m.get("status") == "met")
    partial = sum(1 for m in matches if m.get("status") == "partial")
    unmet = sum(1 for m in matches if m.get("status") == "unmet")

    critical_flags = [f for f in flags if f.get("type") == "critical"]
    warning_flags = [f for f in flags if f.get("type") == "warning"]

    prompt = f"""Analyze this bid compliance data for a Government e-Marketplace (GeM) procurement tender.

## Tender Information
- Department: {department or tender_info.get('department', 'Unknown')}
- Tender Type: {tender_info.get('tender_type', 'open')}
- Estimated Value: ₹{tender_info.get('estimated_value', 'N/A')}

## Compliance Scores (0-100)
- Overall Score: {scores.get('overall', 0):.1f}
- Eligibility: {scores.get('eligibility', 0):.1f}
- Compliance: {scores.get('compliance', 0):.1f}
- Risk: {scores.get('risk', 0):.1f} (higher = lower risk)
- Completeness: {scores.get('completeness', 0):.1f}
- Quality: {scores.get('quality', 0):.1f}
- Risk Level: {scores.get('risk_level', 'medium')}

## Requirement Matching
- Requirements Met: {met}/{met + partial + unmet}
- Partially Met: {partial}
- Unmet: {unmet}

## Unmet Requirements:
{chr(10).join(f"- {m.get('requirement_text', '')}: {m.get('evidence_summary', '')}" for m in matches if m.get('status') == 'unmet')}

## Critical Flags ({len(critical_flags)}):
{chr(10).join(f"- {f.get('message', '')}" for f in critical_flags)}

## Warning Flags ({len(warning_flags)}):
{chr(10).join(f"- {f.get('message', '')}" for f in warning_flags)}

## Issues ({len(issues)}):
{chr(10).join(f"- [{i.get('severity', '')}] {i.get('description', '')}" for i in issues)}

Provide your compliance assessment as a procurement compliance expert. Reference applicable GFR 2017 rules or GeM guidelines where relevant."""

    return prompt


def _format_recommendation(result: dict) -> str:
    """Format the AI recommendation into readable text."""
    action = result.get("recommendation", "CLARIFICATION_NEEDED")
    summary = result.get("summary", "")
    detailed = result.get("detailed_reasoning", "")
    findings = result.get("key_findings", [])
    missing = result.get("missing_items", [])

    text = f"**Recommendation: {action}**\n\n"
    text += f"{summary}\n\n"

    if findings:
        text += "**Key Findings:**\n"
        for f in findings:
            text += f"• {f}\n"
        text += "\n"

    if missing:
        text += "**Missing/Required Items:**\n"
        for m in missing:
            text += f"• {m}\n"
        text += "\n"

    text += f"**Detailed Analysis:**\n{detailed}"
    return text


def _format_reasoning_trace(result: dict) -> str:
    """Format the reasoning into an auditable trace."""
    lines = ["=== AI COMPLIANCE REASONING TRACE ===", ""]
    lines.append(f"Decision: {result.get('recommendation', 'N/A')}")
    lines.append(f"Confidence: {result.get('confidence', 0):.0%}")
    lines.append(f"Summary: {result.get('summary', '')}")
    lines.append("")
    lines.append("--- Key Findings ---")
    for f in result.get("key_findings", []):
        lines.append(f"  • {f}")
    lines.append("")
    lines.append("--- Risk Factors ---")
    for r in result.get("risk_factors", []):
        lines.append(f"  ⚠ {r}")
    lines.append("")
    lines.append("--- Detailed Reasoning ---")
    lines.append(result.get("detailed_reasoning", ""))
    lines.append("")
    lines.append("=== END TRACE ===")
    return "\n".join(lines)


def _fallback_recommendation(scores, matches, flags, issues):
    """Generate a rule-based recommendation when Groq is unavailable."""
    overall = scores.get("overall", 0) if isinstance(scores, dict) else scores.overall
    risk_level = scores.get("risk_level", "medium") if isinstance(scores, dict) else scores.risk_level

    critical_flags = [f for f in flags if f.get("type") == "critical"]
    unmet = [m for m in matches if (m.get("status") if isinstance(m, dict) else m.status) == "unmet"]

    if critical_flags:
        action = "REJECT"
        summary = f"Critical compliance issues detected. {len(critical_flags)} critical flag(s) require immediate attention."
    elif overall >= 75 and not unmet:
        action = "APPROVE"
        summary = f"Overall compliance score of {overall:.1f}/100 with all requirements met. Low risk profile."
    elif overall >= 50:
        action = "CLARIFICATION_NEEDED"
        summary = f"Score of {overall:.1f}/100 with {len(unmet)} unmet requirement(s). Clarification needed."
    else:
        action = "REJECT"
        summary = f"Low compliance score of {overall:.1f}/100. Multiple requirements unmet."

    recommendation = f"**Recommendation: {action}**\n\n{summary}"
    reasoning = f"Rule-based assessment (AI API unavailable). Overall: {overall:.1f}, Risk: {risk_level}, Critical flags: {len(critical_flags)}, Unmet: {len(unmet)}"

    return recommendation, reasoning, {"recommendation": action, "summary": summary, "steps": []}
