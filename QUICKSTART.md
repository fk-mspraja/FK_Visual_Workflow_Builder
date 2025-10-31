# FourKites Workflow Builder - Quick Start Guide

## Prerequisites

Make sure you have these installed:
- **Python 3.11+**
- **Node.js 20+**
- **Redis** (for session storage)
- **Temporal** (for workflow orchestration)

## Step-by-Step Local Setup

### 1. Clone and Navigate

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder
```

### 2. Set Up Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit .env file - add your Anthropic API key
nano .env
# Or use your preferred editor:
# code .env
# vi .env
```

**Minimum required in `.env`:**
```bash
ANTHROPIC_API_KEY=your_actual_key_here
```

### 3. Start Backend Services (Terminal 1)

```bash
# Install backend dependencies
cd /Users/msp.raja/FK_Visual_Workflow_Builder/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Backend will be available at:** http://localhost:8001
**API Docs:** http://localhost:8001/docs

### 4. Start Frontend (Terminal 2)

```bash
# Install frontend dependencies
cd /Users/msp.raja/FK_Visual_Workflow_Builder/frontend
npm install

# Start frontend dev server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

### 5. Start Redis (Terminal 3)

```bash
# If Redis is installed via Homebrew:
redis-server

# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### 6. Start Temporal Server (Terminal 4)

```bash
# Option A: Using Docker (Recommended)
docker run -d -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest

# Option B: If Temporal CLI is installed
temporal server start-dev
```

**Temporal UI will be available at:** http://localhost:8233

### 7. Start Temporal Worker (Terminal 5)

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder/temporal
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the worker
python workers/fourkites_worker.py
```

---

## Quick Test Commands (All-in-One)

If you want to test everything quickly without multiple terminals:

### Option 1: Using Docker Compose (Easiest)

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder/infrastructure/docker

# Create .env file with your API key
echo "ANTHROPIC_API_KEY=your_key_here" > ../../.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Using Makefile

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder

# Setup (first time only)
make setup

# Start development environment
make dev
```

---

## Verify Everything is Running

Run this command to check all services:

```bash
# Check backend
curl http://localhost:8001/health

# Check frontend (should return HTML)
curl http://localhost:3000

# Check Redis
redis-cli ping

# Check Temporal UI
curl http://localhost:8233
```

---

## Access the Application

Once all services are running:

1. **Open your browser:** http://localhost:3000
2. **Click "AI Workflow Builder"** to start creating workflows conversationally
3. **Try saying:** "Create a workflow to send an email notification when a shipment is late"
4. **Monitor workflows:** http://localhost:8233 (Temporal UI)
5. **View API docs:** http://localhost:8001/docs

---

## Service Ports Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8001 | http://localhost:8001 |
| API Docs | 8001 | http://localhost:8001/docs |
| Temporal UI | 8233 | http://localhost:8233 |
| Redis | 6379 | localhost:6379 |

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8001 (backend)
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 7233 (Temporal)
lsof -ti:7233 | xargs kill -9
```

### Backend Import Errors

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder/backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Frontend Build Errors

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder/frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it:
redis-server
```

---

## Testing the AI Workflow Builder

Once everything is running:

1. Go to http://localhost:3000
2. You should see the FourKites Workflow Builder interface
3. Try these example prompts:

   **Example 1: Email Notification**
   ```
   "Create a workflow that sends an email to the facility manager when a shipment is delayed"
   ```

   **Example 2: Document Processing**
   ```
   "I want to extract data from a PDF invoice and send it via email"
   ```

   **Example 3: Conditional Logic**
   ```
   "Create a workflow that checks if a shipment is late, and if yes, send an escalation email"
   ```

4. The agent will ask you for missing parameters (recipient email, facility, etc.)
5. Click "Approve" when you're happy with the workflow
6. The visual flow will appear on the right side

---

## Next Steps

- Read the full [Deployment Guide](docs/DEPLOYMENT.md)
- Explore the [API Documentation](http://localhost:8001/docs)
- Check [Architecture Docs](docs/ARCHITECTURE.md)
- View [Production Audit](docs/audits/PRODUCTION_AUDIT_REPORT.md)

---

## Quick Commands Summary

```bash
# Setup (one time)
cd /Users/msp.raja/FK_Visual_Workflow_Builder
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Backend
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Redis (new terminal)
redis-server

# Temporal (new terminal)
docker run -d -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest

# Access: http://localhost:3000
```

---

**Happy Building!** 🚀
