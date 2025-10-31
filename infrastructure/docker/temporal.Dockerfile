FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy temporal requirements
COPY temporal/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy temporal code
COPY temporal/ .

# Health check (check if worker process is running)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD pgrep -f "python.*worker" || exit 1

# Run the worker
CMD ["python", "workers/fourkites_worker.py"]
