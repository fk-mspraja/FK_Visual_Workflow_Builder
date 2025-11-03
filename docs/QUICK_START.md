# Quick Start Guide

## Project Overview

This Temporal Python project is organized into logical folders:

```
temporal-project/
├── src/                    # Core source code
│   ├── activities/        # Activity implementations
│   └── workflows/         # Workflow implementations
├── workers/               # Worker processes
├── examples/              # Example scripts
├── monitoring/            # Monitoring utilities
├── docs/                  # Documentation
└── README.md             # Main documentation
```

## Commands Cheat Sheet

### Starting the System

```bash
# Start the basic worker
python3 workers/worker.py

# OR start worker with failure handling support
python3 workers/worker_with_failing.py
```

### Running Examples

```bash
# Execute a simple workflow
python3 examples/starter.py

# Test failure handling
python3 examples/failing_example.py
```

### Monitoring Workflows

```bash
# List all workflows
python3 monitoring/list_workflows.py

# List only failed workflows
python3 monitoring/list_failed_workflows.py

# Get details of a specific workflow
python3 monitoring/get_workflow_details.py <workflow-id>

# Real-time monitoring (updates every 5 seconds)
python3 monitoring/monitor_workflows.py

# Custom interval (e.g., every 10 seconds)
python3 monitoring/monitor_workflows.py 10
```

## Typical Workflow

1. **Start Worker** (keep running)
   ```bash
   python3 workers/worker.py
   ```

2. **Execute Workflows** (in another terminal)
   ```bash
   python3 examples/starter.py
   ```

3. **Monitor Results**
   ```bash
   python3 monitoring/list_workflows.py
   ```

4. **Check Temporal Web UI**
   ```
   Open: http://localhost:8233
   ```

## Testing Failures

1. Stop the basic worker (Ctrl+C)

2. Start the failure-aware worker:
   ```bash
   python3 workers/worker_with_failing.py
   ```

3. Trigger a failing workflow:
   ```bash
   python3 examples/failing_example.py
   ```

4. View failed workflows:
   ```bash
   python3 monitoring/list_failed_workflows.py
   ```

## File Descriptions

### Source Code (`src/`)
- **activities/activities.py** - Activity definitions (business logic)
- **workflows/workflows.py** - Workflow definitions (orchestration)

### Workers (`workers/`)
- **worker.py** - Basic worker for standard workflows
- **worker_with_failing.py** - Worker with failure handling examples

### Examples (`examples/`)
- **starter.py** - Simple workflow execution example
- **failing_example.py** - Demonstrates failure handling

### Monitoring (`monitoring/`)
- **list_workflows.py** - View all workflow executions
- **list_failed_workflows.py** - View only failed workflows
- **get_workflow_details.py** - Detailed workflow information
- **monitor_workflows.py** - Real-time workflow monitoring

### Documentation (`docs/`)
- **MONITORING_GUIDE.md** - Comprehensive monitoring documentation

## Key Concepts

**Activity**: A single, well-defined action that can fail and be retried
**Workflow**: Orchestrates activities and contains business logic
**Worker**: Polls for and executes workflows and activities
**Task Queue**: Channel for distributing work to workers

## Common Queries

```python
# Temporal query syntax examples:
"ExecutionStatus='Failed'"                           # Failed workflows
"ExecutionStatus='Running'"                          # Running workflows
"ExecutionStatus='Completed'"                        # Completed workflows
"WorkflowType='SayHelloWorkflow'"                   # By workflow type
"ExecutionStatus='Failed' AND WorkflowType='...'".  # Combined queries
```

## Temporal Web UI

The easiest way to visualize and debug workflows:

**URL**: http://localhost:8233

Features:
- Visual workflow execution timeline
- Activity history and details
- Error messages and stack traces
- Retry and terminate controls
- Search and filter capabilities

## Need More Help?

- **Full Documentation**: See [README.md](README.md)
- **Monitoring Guide**: See [docs/MONITORING_GUIDE.md](docs/MONITORING_GUIDE.md)
- **Temporal Docs**: https://docs.temporal.io/
- **Python SDK Guide**: https://docs.temporal.io/dev-guide/python
