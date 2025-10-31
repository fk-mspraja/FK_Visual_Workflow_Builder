# Backend API

FastAPI backend for FourKites Workflow Builder.

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

## Environment Variables

Create `.env` file with:
```
ANTHROPIC_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Run Development Server

```bash
uvicorn app.main:app --reload --port 8001
```

## Run Tests

```bash
pytest
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
