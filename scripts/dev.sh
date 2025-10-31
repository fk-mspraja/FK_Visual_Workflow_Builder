#!/bin/bash

echo "🚀 Starting FourKites Workflow Builder (Development)"

# Start Redis
echo "Starting Redis..."
docker run -d --name fourkites-redis -p 6379:6379 redis:alpine || docker start fourkites-redis

# Start Temporal
echo "Starting Temporal..."
temporal server start-dev &

sleep 5

# Start Backend
echo "Starting Backend API..."
cd backend && uvicorn app.main:app --reload --port 8001 &

# Start Temporal Worker
echo "Starting Temporal Worker..."
cd temporal/workers && python main_worker.py &

# Start Frontend
echo "Starting Frontend..."
cd frontend && npm run dev &

echo ""
echo "✅ All services started!"
echo "  Backend API: http://localhost:8001"
echo "  Frontend: http://localhost:3000"
echo "  Temporal UI: http://localhost:8233"
