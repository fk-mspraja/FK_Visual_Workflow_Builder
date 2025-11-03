# FourKites Workflow Builder - Backend Dockerfile
# Python FastAPI + Temporal Worker

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy src from parent directory (core workflows and activities)
COPY ../src /app/src

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port 8001 for FastAPI
EXPOSE 8001

# Default command (can be overridden in docker-compose)
CMD ["python", "app/api.py"]
