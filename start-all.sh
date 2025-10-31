#!/bin/bash

###############################################################################
# FourKites Workflow Builder - Start All Services
###############################################################################
# This script starts all services needed for local development:
# - Redis (session storage)
# - Temporal Server (workflow orchestration)
# - Backend API (FastAPI)
# - Frontend UI (Next.js)
# - Temporal Worker (workflow execution)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   FourKites AI Workflow Builder - Local Development       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# 1. Check Prerequisites
###############################################################################

echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env and add your ANTHROPIC_API_KEY${NC}"
    echo -e "${YELLOW}   Then run this script again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env file found${NC}"

# Check if ANTHROPIC_API_KEY is set
if grep -q "your_anthropic_api_key_here" .env || ! grep -q "ANTHROPIC_API_KEY=sk-" .env; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY not configured in .env${NC}"
    echo -e "${YELLOW}   Please edit .env and add your API key from:${NC}"
    echo -e "${YELLOW}   https://console.anthropic.com/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ ANTHROPIC_API_KEY configured${NC}"

echo ""

###############################################################################
# 2. Check and Start Redis
###############################################################################

echo -e "${YELLOW}[2/7] Starting Redis...${NC}"

if command -v redis-cli &> /dev/null; then
    # Check if Redis is already running
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis already running${NC}"
    else
        # Try to start Redis
        if command -v redis-server &> /dev/null; then
            redis-server --daemonize yes &> /dev/null
            sleep 2
            if redis-cli ping &> /dev/null; then
                echo -e "${GREEN}✓ Redis started${NC}"
            else
                echo -e "${YELLOW}⚠️  Redis failed to start, trying Docker...${NC}"
                docker run -d --name fourkites-redis -p 6379:6379 redis:7-alpine &> /dev/null || true
                sleep 2
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Redis CLI not found, trying Docker...${NC}"
    # Try Docker
    if command -v docker &> /dev/null; then
        # Check if container already exists
        if docker ps -a --format '{{.Names}}' | grep -q "^fourkites-redis$"; then
            docker start fourkites-redis &> /dev/null || true
        else
            docker run -d --name fourkites-redis -p 6379:6379 redis:7-alpine &> /dev/null || true
        fi
        sleep 2
        echo -e "${GREEN}✓ Redis started in Docker${NC}"
    else
        echo -e "${RED}❌ Neither Redis nor Docker found${NC}"
        echo -e "${YELLOW}   Install Redis: brew install redis (macOS)${NC}"
        exit 1
    fi
fi

echo ""

###############################################################################
# 3. Check and Start Temporal
###############################################################################

echo -e "${YELLOW}[3/7] Starting Temporal Server...${NC}"

if command -v docker &> /dev/null; then
    # Check if Temporal container already exists
    if docker ps --format '{{.Names}}' | grep -q "^fourkites-temporal$"; then
        echo -e "${GREEN}✓ Temporal already running${NC}"
    else
        # Remove old container if exists but stopped
        docker rm fourkites-temporal &> /dev/null || true

        # Start new Temporal container
        docker run -d \
            --name fourkites-temporal \
            -p 7233:7233 \
            -p 8233:8233 \
            temporalio/auto-setup:latest &> /dev/null

        echo -e "${GREEN}✓ Temporal started (waiting 10s for initialization...)${NC}"
        sleep 10
    fi
else
    echo -e "${RED}❌ Docker not found. Temporal requires Docker.${NC}"
    echo -e "${YELLOW}   Install Docker from: https://www.docker.com/get-started${NC}"
    exit 1
fi

echo ""

###############################################################################
# 4. Install Backend Dependencies
###############################################################################

echo -e "${YELLOW}[4/7] Setting up Backend...${NC}"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}  Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo -e "${BLUE}  Installing Python dependencies...${NC}"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..
echo ""

###############################################################################
# 5. Install Frontend Dependencies
###############################################################################

echo -e "${YELLOW}[5/7] Setting up Frontend...${NC}"

cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}  Installing Node.js dependencies (this may take a while)...${NC}"
    npm install --silent
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

cd ..
echo ""

###############################################################################
# 6. Kill Old Processes
###############################################################################

echo -e "${YELLOW}[6/7] Cleaning up old processes...${NC}"

# Kill old backend processes
lsof -ti:8001 | xargs kill -9 2>/dev/null || true

# Kill old frontend processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill old Temporal workers
pkill -9 -f "fourkites_worker.py" 2>/dev/null || true

sleep 1
echo -e "${GREEN}✓ Old processes cleaned up${NC}"
echo ""

###############################################################################
# 7. Start All Services
###############################################################################

echo -e "${YELLOW}[7/7] Starting all services...${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Start Backend
echo -e "${BLUE}  Starting Backend API on port 8001...${NC}"
cd backend
source venv/bin/activate
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Check if backend started successfully
if lsof -ti:8001 &> /dev/null; then
    echo -e "${GREEN}  ✓ Backend API started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}  ❌ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Start Frontend
echo -e "${BLUE}  Starting Frontend on port 3000...${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5

# Check if frontend started successfully
if lsof -ti:3000 &> /dev/null; then
    echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}  ❌ Frontend failed to start. Check logs/frontend.log${NC}"
    exit 1
fi

# Start Temporal Worker (optional - only if temporal directory exists)
if [ -d "temporal" ]; then
    echo -e "${BLUE}  Starting Temporal Worker...${NC}"
    cd temporal

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install --quiet -r requirements.txt
    else
        source venv/bin/activate
    fi

    # Check if worker file exists
    if [ -f "workers/fourkites_worker.py" ]; then
        nohup python3 workers/fourkites_worker.py > ../logs/temporal-worker.log 2>&1 &
        WORKER_PID=$!
        echo -e "${GREEN}  ✓ Temporal Worker started (PID: $WORKER_PID)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Temporal worker not found, skipping...${NC}"
    fi

    cd ..
fi

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🚀 ALL SERVICES STARTED SUCCESSFULLY!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   ${GREEN}Frontend:${NC}          http://localhost:3000"
echo -e "   ${GREEN}Backend API:${NC}       http://localhost:8001"
echo -e "   ${GREEN}API Docs:${NC}          http://localhost:8001/docs"
echo -e "   ${GREEN}Temporal UI:${NC}       http://localhost:8233"
echo ""
echo -e "${BLUE}📋 Service Status:${NC}"
echo -e "   ${GREEN}✓ Redis:${NC}           Running on port 6379"
echo -e "   ${GREEN}✓ Temporal:${NC}        Running on ports 7233, 8233"
echo -e "   ${GREEN}✓ Backend:${NC}         Running on port 8001 (PID: $BACKEND_PID)"
echo -e "   ${GREEN}✓ Frontend:${NC}        Running on port 3000 (PID: $FRONTEND_PID)"
if [ ! -z "$WORKER_PID" ]; then
    echo -e "   ${GREEN}✓ Temporal Worker:${NC} Running (PID: $WORKER_PID)"
fi
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:        tail -f logs/backend.log"
echo -e "   Frontend:       tail -f logs/frontend.log"
if [ ! -z "$WORKER_PID" ]; then
    echo -e "   Temporal:       tail -f logs/temporal-worker.log"
fi
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo -e "   ./stop-all.sh"
echo ""
echo -e "${YELLOW}⏳ Please wait 5-10 seconds for all services to fully initialize...${NC}"
echo ""

# Save PIDs to file for stop script
cat > .pids << EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
WORKER_PID=${WORKER_PID:-}
EOF

# Wait a bit and verify services
sleep 5

# Final health check
echo -e "${BLUE}🔍 Performing health check...${NC}"

if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend still warming up (this is normal)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Ready to build workflows! Open http://localhost:3000 in your browser${NC}"
echo ""
