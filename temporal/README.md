# Temporal Workflows & Activities

Workflow orchestration using Temporal.io

## Setup

```bash
cd temporal
pip install -r requirements.txt
```

## Start Temporal Server

```bash
temporal server start-dev
```

## Start Worker

```bash
python workers/main_worker.py
```

## Test Workflows

```bash
pytest tests/
```
