# GemVerify — AI-Powered Government Bid Compliance Platform

<p align="center">
  <strong>Automated document verification, compliance scoring, and risk assessment for Government e-Marketplace (GeM) tenders</strong>
</p>

---

## Architecture

```
Browser (Bidder)  ←→  Vite :5173  ←→  Go Gateway :8000  ←→  gRPC  ←→  Python AI :50051
Browser (Officer) ←→  Vite :5174  ←↗        ↕                              ↕
                                        PostgreSQL                    Mock Gov API :8001
                                        Redis
                                        MinIO
```

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| `web-bidder` | React + Vite + TS | 5173 | Bidder portal — browse tenders, submit bids |
| `web-officer` | React + Vite + TS | 5174 | Officer portal — manage tenders, review compliance |
| `gateway` | Go (Fiber) | 8000 | REST API + WebSocket + gRPC client |
| `ai-svc` | Python (FastAPI + gRPC) | 50051 | OCR, verification, scoring, LLM recommendations |
| `mock-gov-api` | Python (FastAPI) | 8001 | Simulated Udyam/GST/PAN/MCA21/EPFO registries |

## AI Pipeline

```
Document Upload → OCR Extraction → Registry Verification → Requirement Matching
    → Fraud Detection → Multi-Dimensional Scoring → AI Recommendation (Groq/Llama 3)
```

**Six compliance sub-scores:** Eligibility · Compliance · Risk · Completeness · Quality · Overall

## Quick Start

### Prerequisites
- Node.js 18+, Go 1.22+, Python 3.11+
- PostgreSQL 16 + pgvector, Redis 7+
- MinIO (optional — file uploads)
- Tesseract OCR (optional — document processing)

### Setup

```bash
# 1. Clone and install
git clone <repo> && cd gemverify

# 2. PostgreSQL setup
sudo -u postgres psql -c "CREATE USER gemuser WITH PASSWORD 'gempass123';"
sudo -u postgres psql -c "CREATE DATABASE gemverify OWNER gemuser;"

# 3. Start all services
./scripts/dev.sh

# 4. Seed demo data (in another terminal, after services are running)
./scripts/seed.sh
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Officer | officer@gem.gov.in | officer123 |
| Bidder | amit@techcorp.in | bidder123 |
| Bidder | priya@greenenergy.in | bidder123 |
| Bidder | rahul@bharathdef.in | bidder123 |

## Project Structure

```
├── apps/
│   ├── web-bidder/          # React bidder portal
│   ├── web-officer/         # React officer portal
│   ├── gateway/             # Go REST/WS/gRPC gateway
│   ├── ai-svc/              # Python AI pipeline
│   └── mock-gov-api/        # Mock government APIs
├── packages/
│   ├── shared-types/        # Shared TypeScript types
│   └── proto/               # gRPC protobuf definitions
├── scripts/
│   ├── dev.sh               # Start all services
│   └── seed.sh              # Seed demo data
├── turbo.json               # Turborepo config
└── package.json             # Root workspace
```

## Key Features

- **Document OCR**: Tesseract-based extraction with 12 document-specific parsers
- **Registry Verification**: Parallel checks against 9 mock government APIs
- **AI Scoring**: 6-dimensional compliance scoring with automatic risk classification
- **LLM Recommendations**: Groq/Llama 3.3 70B with structured JSON reasoning traces
- **Real-time Updates**: WebSocket pipeline progress and bid status notifications
- **Audit Trail**: Immutable CVC-compliant action logging
- **Role-Based Access**: JWT auth with bidder/officer/admin roles

## License

MIT
