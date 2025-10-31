#!/bin/bash

###############################################################################
# Simple Starter - No Docker Required
# Just starts Backend + Frontend (for quick testing)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   FourKites Workflow Builder - Simple Start (No Docker)   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

if ! grep -q "ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY not configured in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Kill old processes
echo -e "${YELLOW}Cleaning up old processes...${NC}"
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Cleaned up${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Install backend deps
echo -e "${YELLOW}Setting up Backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}✓ Backend ready${NC}"
cd ..
echo ""

# Install frontend deps
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --silent
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
cd ..
echo ""

# Start backend
echo -e "${YELLOW}Starting Backend API on port 8001...${NC}"
cd backend
source venv/bin/activate
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

if lsof -ti:8001 &> /dev/null; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed. Check logs/backend.log${NC}"
    exit 1
fi
echo ""

# Start frontend
echo -e "${YELLOW}Starting Frontend on port 3000...${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5

if lsof -ti:3000 &> /dev/null; then
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed. Check logs/frontend.log${NC}"
    exit 1
fi

# Save PIDs
cat > .pids << EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               🚀 SERVICES STARTED SUCCESSFULLY!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   ${GREEN}Frontend:${NC}      http://localhost:3000"
echo -e "   ${GREEN}Backend API:${NC}   http://localhost:8001"
echo -e "   ${GREEN}API Docs:${NC}      http://localhost:8001/docs"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:  tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop:${NC}"
echo -e "   ./stop-all.sh"
echo ""
echo -e "${YELLOW}⚠️  Note: Redis & Temporal not started (Docker required)${NC}"
echo -e "${YELLOW}   For full stack, install Docker and run: ./start-all.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Open http://localhost:3000 in your browser!${NC}"
echo ""
