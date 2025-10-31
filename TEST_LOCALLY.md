# Testing Locally - Quick Guide

## 🚀 One-Command Start

```bash
cd /Users/msp.raja/FK_Visual_Workflow_Builder
./start-all.sh
```

This single command will:
1. ✅ Check all prerequisites (Python, Node.js, etc.)
2. ✅ Verify your ANTHROPIC_API_KEY is configured
3. ✅ Start Redis (session storage)
4. ✅ Start Temporal Server (workflow orchestration)
5. ✅ Install backend dependencies
6. ✅ Install frontend dependencies
7. ✅ Start Backend API on port 8001
8. ✅ Start Frontend UI on port 3000
9. ✅ Start Temporal Worker
10. ✅ Perform health checks

## 🛑 Stop All Services

```bash
./stop-all.sh
```

This will gracefully stop all services and clean up processes.

---

## 📋 What You'll See

After running `./start-all.sh`, you should see:

```
╔════════════════════════════════════════════════════════════╗
║              🚀 ALL SERVICES STARTED SUCCESSFULLY!         ║
╚════════════════════════════════════════════════════════════╝

📍 Service URLs:
   Frontend:          http://localhost:3000
   Backend API:       http://localhost:8001
   API Docs:          http://localhost:8001/docs
   Temporal UI:       http://localhost:8233

📋 Service Status:
   ✓ Redis:           Running on port 6379
   ✓ Temporal:        Running on ports 7233, 8233
   ✓ Backend:         Running on port 8001 (PID: XXXXX)
   ✓ Frontend:        Running on port 3000 (PID: XXXXX)
   ✓ Temporal Worker: Running (PID: XXXXX)

🎉 Ready to build workflows! Open http://localhost:3000 in your browser
```

---

## 🌐 Access the Application

1. **Open your browser:** http://localhost:3000
2. **Click "AI Workflow Builder"**
3. **Start creating workflows conversationally!**

Try saying:
- "Create a workflow to send an email notification when a shipment is late"
- "I want to extract data from a PDF and email it"
- "Create a workflow that checks if delivery is delayed and escalates"

---

## 📊 Monitor & Debug

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Temporal worker logs
tail -f logs/temporal-worker.log
```

### Check Service Health

```bash
# Backend health check
curl http://localhost:8001/health

# Temporal UI
open http://localhost:8233

# API Documentation
open http://localhost:8001/docs
```

### Check Running Processes

```bash
# Check backend
lsof -ti:8001

# Check frontend
lsof -ti:3000

# View all logs
ls -la logs/
```

---

## ⚠️ Troubleshooting

### If ANTHROPIC_API_KEY is not set:

```bash
# Edit .env file
nano .env

# Add your API key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...

# Run start script again
./start-all.sh
```

### If ports are already in use:

```bash
# Stop all services first
./stop-all.sh

# Kill specific ports manually
lsof -ti:8001 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend

# Start again
./start-all.sh
```

### If Redis fails to start:

```bash
# Install Redis (macOS)
brew install redis

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### If Temporal fails to start:

```bash
# Make sure Docker is running
docker ps

# Remove old container
docker rm -f fourkites-temporal

# Start again
./start-all.sh
```

### If backend fails with import errors:

```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
./start-all.sh
```

### If frontend fails with dependency errors:

```bash
cd frontend
rm -rf node_modules .next
npm install
cd ..
./start-all.sh
```

---

## 🧪 Manual Testing (Without Scripts)

If you prefer to start services manually:

### Terminal 1 - Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8001
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 3 - Redis
```bash
redis-server
```

### Terminal 4 - Temporal
```bash
docker run -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest
```

---

## 📦 First-Time Setup

If this is your first time:

```bash
# 1. Navigate to repo
cd /Users/msp.raja/FK_Visual_Workflow_Builder

# 2. Copy environment file
cp .env.example .env

# 3. Edit and add your API key
nano .env
# Add: ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# 4. Make scripts executable (already done)
chmod +x start-all.sh stop-all.sh

# 5. Run!
./start-all.sh
```

---

## 🎯 Success Checklist

After running `./start-all.sh`, verify:

- [ ] Backend API responds: `curl http://localhost:8001/health`
- [ ] Frontend loads: Open http://localhost:3000
- [ ] API docs visible: http://localhost:8001/docs
- [ ] Temporal UI works: http://localhost:8233
- [ ] No errors in logs: `tail -f logs/*.log`

If all checks pass, you're ready to build workflows! 🎉

---

## 📚 Next Steps

- Read the [QUICKSTART.md](QUICKSTART.md) for detailed setup
- Check [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment
- View [README.md](README.md) for architecture overview

---

**Need help?** Check the logs in the `logs/` directory or run `./stop-all.sh` and start fresh!
