#!/bin/bash

###############################################################################
# FourKites Workflow Builder - Stop All Services
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Stopping FourKites Workflow Builder Services       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop services by PIDs from file
if [ -f .pids ]; then
    echo -e "${YELLOW}Stopping services by PID...${NC}"
    source .pids

    if [ ! -z "$BACKEND_PID" ]; then
        kill -9 $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓ Backend stopped${NC}" || echo -e "${YELLOW}⚠️  Backend PID not found${NC}"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill -9 $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}" || echo -e "${YELLOW}⚠️  Frontend PID not found${NC}"
    fi

    if [ ! -z "$WORKER_PID" ]; then
        kill -9 $WORKER_PID 2>/dev/null && echo -e "${GREEN}✓ Temporal worker stopped${NC}" || echo -e "${YELLOW}⚠️  Worker PID not found${NC}"
    fi

    rm .pids
fi

# Kill processes by port (fallback)
echo -e "${YELLOW}Cleaning up processes by port...${NC}"

# Kill backend (port 8001)
lsof -ti:8001 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Backend (port 8001) stopped${NC}" || true

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Frontend (port 3000) stopped${NC}" || true

# Kill any Python workers
pkill -9 -f "fourkites_worker.py" 2>/dev/null && echo -e "${GREEN}✓ Temporal workers stopped${NC}" || true
pkill -9 -f "uvicorn app.main:app" 2>/dev/null || true

# Stop Docker containers (optional - comment out if you want to keep them running)
echo ""
echo -e "${YELLOW}Stopping Docker containers...${NC}"

if command -v docker &> /dev/null; then
    # Stop Redis
    docker stop fourkites-redis 2>/dev/null && echo -e "${GREEN}✓ Redis stopped${NC}" || true

    # Stop Temporal
    docker stop fourkites-temporal 2>/dev/null && echo -e "${GREEN}✓ Temporal stopped${NC}" || true

    echo -e "${BLUE}Note: Docker containers are stopped but not removed.${NC}"
    echo -e "${BLUE}To start them again, just run ./start-all.sh${NC}"
    echo -e "${BLUE}To remove containers: docker rm fourkites-redis fourkites-temporal${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ ALL SERVICES STOPPED SUCCESSFULLY             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
