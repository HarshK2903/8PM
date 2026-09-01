"""
GemVerify AI Service — gRPC Server

This is the heart of the platform. It exposes AI/ML capabilities
to the Go gateway via gRPC:

- Document OCR & field extraction (Tesseract)
- Government registry verification (mock APIs)
- Requirement ↔ Evidence matching
- Multi-dimensional compliance scoring
- AI recommendation generation (Groq/Llama 3)
- Policy RAG & Compliance Copilot
- Fraud/collusion detection (structural placeholder)
"""

import asyncio
import logging
import os
import signal
from concurrent import futures

import grpc
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai-svc")

# gRPC server port
GRPC_PORT = os.getenv("GRPC_PORT", "50051")
MOCK_GOV_API_URL = os.getenv("MOCK_GOV_API_URL", "http://localhost:8001")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def serve():
    """Start the gRPC server."""
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ("grpc.max_send_message_length", 50 * 1024 * 1024),  # 50MB
            ("grpc.max_receive_message_length", 50 * 1024 * 1024),
        ],
    )

    # Register service implementations
    # (will be added after proto compilation)
    # ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceImpl(), server)

    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    server.start()

    logger.info(f"🧠 AI Service (gRPC) listening on port {GRPC_PORT}")

    # Graceful shutdown
    def handle_sigterm(*_):
        logger.info("👋 AI Service shutting down...")
        done = server.stop(grace=5)
        done.wait()

    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigterm)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
