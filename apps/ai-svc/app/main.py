"""
GemVerify AI Service — gRPC Server

Implements the AIService gRPC contract defined in ai_service.proto.
Runs the full compliance pipeline: OCR → Verification → Matching → Scoring → Recommendation
"""

import asyncio
import logging
import os
import sys
import time
from concurrent import futures

import grpc
from dotenv import load_dotenv

# Fix proto import path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.proto import ai_service_pb2
from app.proto import ai_service_pb2_grpc
from app.ai.pipeline import run_pipeline

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("ai-svc")


class AIServiceServicer(ai_service_pb2_grpc.AIServiceServicer):
    """Implements all gRPC RPCs for the AI compliance service."""

    def RunCompliancePipeline(self, request, context):
        """Run the full AI compliance pipeline for a bid."""
        logger.info(f"Pipeline request: bid={request.bid_id}, tender={request.tender_id}, docs={len(request.documents)}")

        start = time.time()

        # Convert proto documents to dicts
        documents = []
        for doc in request.documents:
            documents.append({
                "document_id": doc.document_id,
                "doc_type": doc.doc_type,
                "file_path": doc.file_path,
                "original_filename": doc.original_filename,
                "mime_type": doc.mime_type,
            })

        # Convert proto tender requirements to dict
        tender_reqs = {
            "tender_id": request.tender_requirements.tender_id,
            "department": request.tender_requirements.department,
            "required_documents": list(request.tender_requirements.required_documents),
            "msme_required": request.tender_requirements.msme_required,
            "make_in_india_required": request.tender_requirements.make_in_india_required,
            "startup_required": request.tender_requirements.startup_required,
            "min_turnover": request.tender_requirements.min_turnover,
            "local_content_percentage": request.tender_requirements.local_content_percentage,
        }

        # Run pipeline synchronously (wrapping async)
        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                run_pipeline(
                    bid_id=request.bid_id,
                    tender_id=request.tender_id,
                    documents=documents,
                    tender_requirements=tender_reqs,
                    partial_rerun=request.partial_rerun,
                    rerun_doc_types=list(request.rerun_doc_types),
                )
            )
        finally:
            loop.close()

        # Build response
        response = ai_service_pb2.PipelineResponse()
        response.bid_id = request.bid_id
        response.pipeline_duration_ms = int((time.time() - start) * 1000)

        # Scores
        if result.scores:
            scores_dict = result.scores.to_dict() if hasattr(result.scores, 'to_dict') else {}
            response.scores.overall = scores_dict.get("overall", 0)
            response.scores.eligibility = scores_dict.get("eligibility", 0)
            response.scores.compliance = scores_dict.get("compliance", 0)
            response.scores.risk = scores_dict.get("risk", 0)
            response.scores.completeness = scores_dict.get("completeness", 0)
            response.scores.quality = scores_dict.get("quality", 0)

        response.risk_level = result.risk_level or "medium"

        # Requirement matches
        if result.requirement_matches:
            for m in result.requirement_matches:
                match_pb = ai_service_pb2.RequirementMatch()
                if hasattr(m, 'requirement_id'):
                    match_pb.requirement_id = m.requirement_id
                    match_pb.requirement_text = m.requirement_text
                    match_pb.status = m.status
                    match_pb.evidence_summary = m.evidence_summary
                    match_pb.source_document = m.source_document or ""
                    match_pb.confidence = m.confidence
                response.requirement_matches.append(match_pb)

        # Flags
        for f in result.flags:
            flag_pb = ai_service_pb2.ComplianceFlag()
            flag_pb.flag_type = f.get("type", "info")
            flag_pb.message = f.get("message", "")
            flag_pb.field = f.get("field", "")
            flag_pb.recommendation = f.get("recommendation", "")
            response.flags.append(flag_pb)

        # Issues
        for issue in result.issues:
            issue_pb = ai_service_pb2.ComplianceIssue()
            issue_pb.severity = issue.get("severity", "medium")
            issue_pb.description = issue.get("description", "")
            issue_pb.recommendation = issue.get("recommendation", "")
            issue_pb.related_doc = issue.get("related_doc", "")
            response.issues.append(issue_pb)

        # Evidence
        for doc_type, ev in result.evidence.items():
            ev_pb = ai_service_pb2.Evidence()
            ev_pb.doc_type = doc_type
            ev_pb.status = ev.get("status", "unknown")
            ev_pb.source = ev.get("source", "")
            ev_pb.confidence = ev.get("confidence", 0.0)
            if isinstance(ev.get("data"), dict):
                for k, v in ev["data"].items():
                    ev_pb.data[k] = str(v)
            response.evidence[doc_type].CopyFrom(ev_pb)

        # AI recommendation
        response.ai_recommendation = result.ai_recommendation or ""
        response.reasoning_trace = result.reasoning_trace or ""

        # Steps
        for step in result.steps_completed:
            step_pb = ai_service_pb2.PipelineStep()
            step_pb.name = step.get("name", "")
            step_pb.status = step.get("status", "")
            step_pb.duration_ms = step.get("duration_ms", 0)
            response.steps_completed.append(step_pb)

        logger.info(f"Pipeline complete: bid={request.bid_id}, score={response.scores.overall:.1f}, risk={response.risk_level}, duration={response.pipeline_duration_ms}ms")
        return response

    def StreamPipelineProgress(self, request, context):
        """Stream real-time pipeline progress events."""
        logger.info(f"Stream progress request: bid={request.bid_id}")

        events_queue = asyncio.Queue()

        async def progress_callback(bid_id, step, status, progress, message):
            await events_queue.put((step, status, progress, message))

        # Run pipeline in background
        loop = asyncio.new_event_loop()
        documents = [{"doc_type": doc.doc_type, "file_path": doc.file_path, "original_filename": doc.original_filename} for doc in request.documents]
        tender_reqs = {
            "required_documents": list(request.tender_requirements.required_documents),
            "department": request.tender_requirements.department,
            "msme_required": request.tender_requirements.msme_required,
            "make_in_india_required": request.tender_requirements.make_in_india_required,
        }

        async def run_and_emit():
            await run_pipeline(
                bid_id=request.bid_id, tender_id=request.tender_id,
                documents=documents, tender_requirements=tender_reqs,
                progress_callback=progress_callback,
            )
            await events_queue.put(None)  # Signal completion

        import threading
        def run_loop():
            loop.run_until_complete(run_and_emit())

        thread = threading.Thread(target=run_loop)
        thread.start()

        # Yield events as they come
        import time as time_mod
        while True:
            time_mod.sleep(0.1)
            try:
                item = events_queue.get_nowait()
                if item is None:
                    break
                step, status, progress, message = item
                event = ai_service_pb2.PipelineProgressEvent()
                event.bid_id = request.bid_id
                event.step_name = step
                event.status = status
                event.progress_percent = progress
                event.message = message
                event.timestamp_ms = int(time_mod.time() * 1000)
                yield event
            except:
                continue

        thread.join()
        loop.close()

    def ExtractDocument(self, request, context):
        """Run OCR on a single document."""
        from app.ai.ocr import extract_text_from_image, extract_fields

        doc = request.document
        raw_text, confidence = extract_text_from_image(doc.file_path)
        fields = extract_fields(raw_text, doc.doc_type)

        response = ai_service_pb2.DocumentExtractionResponse()
        response.document_id = doc.document_id
        response.raw_text = raw_text
        response.confidence = confidence
        for k, v in fields.items():
            response.extracted_fields[k] = str(v)
        return response

    def VerifyDocument(self, request, context):
        """Verify a single document against mock government APIs."""
        from app.ai.verification import verify_all_documents

        loop = asyncio.new_event_loop()
        try:
            results = loop.run_until_complete(
                verify_all_documents([{
                    "doc_type": request.doc_type,
                    "extracted_data": dict(request.extracted_data),
                }])
            )
        finally:
            loop.close()

        response = ai_service_pb2.VerificationResponse()
        response.document_id = request.document_id

        if request.doc_type in results:
            vr = results[request.doc_type]
            response.status = vr.status
            response.verified_at = vr.verified_at or ""
            for m in vr.mismatches:
                response.mismatches.append(m)
            for e in vr.errors:
                response.errors.append(e)
            for k, v in vr.registry_data.items():
                response.registry_data[k] = str(v)
        else:
            response.status = "not_found"

        return response

    def GetRecommendation(self, request, context):
        """Get AI recommendation for a bid."""
        from app.ai.rag import generate_recommendation

        scores = {
            "overall": request.scores.overall, "eligibility": request.scores.eligibility,
            "compliance": request.scores.compliance, "risk": request.scores.risk,
            "completeness": request.scores.completeness, "quality": request.scores.quality,
        }
        matches = [{"requirement_id": m.requirement_id, "requirement_text": m.requirement_text,
                     "status": m.status, "evidence_summary": m.evidence_summary} for m in request.matches]
        flags = [{"type": f.flag_type, "message": f.message} for f in request.flags]
        issues = [{"severity": i.severity, "description": i.description} for i in request.issues]

        rec, trace, structured = generate_recommendation(scores, matches, flags, issues, {}, {}, request.department)

        response = ai_service_pb2.RecommendationResponse()
        response.recommendation = rec
        response.reasoning_trace = trace
        return response

    def AskCopilot(self, request, context):
        """Handle Copilot Q&A queries."""
        logger.info(f"Copilot query: {request.question[:80]}...")

        # For now return a template response — will be backed by RAG
        response = ai_service_pb2.CopilotResponse()
        response.answer = f"Based on GFR 2017 and GeM guidelines regarding '{request.question[:50]}...': This feature requires a Groq API key for full AI-powered responses. Please configure GROQ_API_KEY in your environment."
        response.confidence = 0.5
        return response

    def ParseTenderDocument(self, request, context):
        """Parse a tender PDF to extract requirements."""
        response = ai_service_pb2.TenderParseResponse()
        response.confidence = 0.0
        response.extracted_metadata["status"] = "Tender PDF parsing not yet implemented"
        return response


def serve():
    port = os.getenv("GRPC_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    logger.info(f"🧠 AI Service gRPC server listening on port {port}")
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("AI Service shutting down...")
        server.stop(0)


if __name__ == "__main__":
    serve()
