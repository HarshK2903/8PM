#!/usr/bin/env bash
# ============================================
# GemVerify — Development Runner
# Starts all services for local development
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     GemVerify — Dev Environment       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"

# --- Check Prerequisites ---
echo -e "\n${BLUE}[1/6] Checking prerequisites...${NC}"

check_cmd() {
    if command -v "$1" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $1"
    else
        echo -e "  ${RED}✗${NC} $1 — not found"
        return 1
    fi
}

check_cmd go
check_cmd node
check_cmd python3
check_cmd redis-server
check_cmd psql

# --- Check PostgreSQL ---
echo -e "\n${BLUE}[2/6] Checking PostgreSQL...${NC}"
if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "  ${YELLOW}⚠${NC} PostgreSQL not running. Starting..."
    sudo service postgresql start 2>/dev/null || sudo systemctl start postgresql 2>/dev/null || echo -e "  ${RED}✗${NC} Could not start PostgreSQL"
fi

# --- Check Redis ---
echo -e "\n${BLUE}[3/6] Checking Redis...${NC}"
if redis-cli ping &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Redis is running"
else
    echo -e "  ${YELLOW}⚠${NC} Starting Redis..."
    redis-server --daemonize yes 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Redis started"
fi

# --- Start Mock Gov API ---
echo -e "\n${BLUE}[4/6] Starting Mock Government API (port 8001)...${NC}"
cd "$PROJECT_ROOT/apps/mock-gov-api"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    ./venv/bin/pip install -q fastapi uvicorn
fi
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
MOCK_PID=$!
echo -e "  ${GREEN}✓${NC} Mock API PID: $MOCK_PID"

# --- Start AI Service ---
echo -e "\n${BLUE}[5/6] Starting AI Service (gRPC port 50051)...${NC}"
cd "$PROJECT_ROOT/apps/ai-svc"
./venv/bin/python -m app.main &
AI_PID=$!
echo -e "  ${GREEN}✓${NC} AI Service PID: $AI_PID"

# --- Start Go Gateway ---
echo -e "\n${BLUE}[6/6] Starting Go Gateway (port 8000)...${NC}"
cd "$PROJECT_ROOT/apps/gateway"
go run ./cmd/server/ &
GW_PID=$!
echo -e "  ${GREEN}✓${NC} Gateway PID: $GW_PID"

# --- Wait a moment then start frontends ---
sleep 2
echo -e "\n${BLUE}Starting Frontend Portals...${NC}"

cd "$PROJECT_ROOT/apps/web-bidder"
npx vite --port 5173 &
WB_PID=$!
echo -e "  ${GREEN}✓${NC} Bidder Portal: http://localhost:5173"

cd "$PROJECT_ROOT/apps/web-officer"
npx vite --port 5174 &
WO_PID=$!
echo -e "  ${GREEN}✓${NC} Officer Portal: http://localhost:5174"

echo -e "\n${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  All services running:                    ║${NC}"
echo -e "${CYAN}║                                           ║${NC}"
echo -e "${CYAN}║  🌐 Gateway:      http://localhost:8000   ║${NC}"
echo -e "${CYAN}║  🏛️  Mock Gov API: http://localhost:8001   ║${NC}"
echo -e "${CYAN}║  🧠 AI Service:   grpc://localhost:50051  ║${NC}"
echo -e "${CYAN}║  👤 Bidder UI:    http://localhost:5173   ║${NC}"
echo -e "${CYAN}║  👮 Officer UI:   http://localhost:5174   ║${NC}"
echo -e "${CYAN}║                                           ║${NC}"
echo -e "${CYAN}║  Press Ctrl+C to stop all services        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"

# --- Trap & Cleanup ---
cleanup() {
    echo -e "\n${YELLOW}Shutting down all services...${NC}"
    kill $MOCK_PID $AI_PID $GW_PID $WB_PID $WO_PID 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
