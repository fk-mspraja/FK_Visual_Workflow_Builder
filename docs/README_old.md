# Temporal Python Project

A complete Temporal workflow project with monitoring and failure handling examples.

## Project Structure

```
temporal-project/
├── src/                           # Source code
│   ├── activities/                # Activity definitions
│   │   ├── __init__.py
│   │   └── activities.py         # Activity implementations
│   └── workflows/                 # Workflow definitions
│       ├── __init__.py
│       └── workflows.py          # Workflow implementations
│
├── workers/                       # Worker processes
│   ├── worker.py                 # Basic worker
│   └── worker_with_failing.py    # Worker with failure handling
│
├── examples/                      # Example scripts
│   ├── starter.py                # Start a workflow
│   └── failing_example.py        # Example of a failing workflow
│
├── monitoring/                    # Monitoring tools
│   ├── list_workflows.py         # List all workflows
│   ├── list_failed_workflows.py  # List only failed workflows
│   ├── get_workflow_details.py   # Get details of specific workflow
│   └── monitor_workflows.py      # Real-time monitoring
│
├── docs/                          # Documentation
│   └── MONITORING_GUIDE.md       # Comprehensive monitoring guide
│
└── README.md                      # This file
```

## Quick Start

### 1. Start the Worker
```bash
python3 workers/worker.py
```

Keep this running in a separate terminal.

### 2. Execute a Workflow
```bash
python3 examples/starter.py
```

## Monitoring Workflows

### List All Workflows
```bash
python3 monitoring/list_workflows.py
```

Shows all workflow executions with status indicators:
- 🔄 Running
- ✅ Completed
- ❌ Failed
- 🚫 Canceled
- ⛔ Terminated
- ⏰ Timed Out

### List Only Failed Workflows
```bash
python3 monitoring/list_failed_workflows.py
```

Shows detailed error information for failed workflows.

### Get Specific Workflow Details
```bash
python3 monitoring/get_workflow_details.py <workflow-id>
```

Example:
```bash
python3 monitoring/get_workflow_details.py say-hello-workflow-ea471419-3e77-4fea-b873-34f59a0fbbcd
```

### Real-Time Monitoring
```bash
python3 monitoring/monitor_workflows.py [interval_seconds]
```

Monitor workflows in real-time. Updates every 5 seconds by default.

Example with custom interval:
```bash
python3 monitoring/monitor_workflows.py 10  # Check every 10 seconds
```

## Testing Failure Handling

### 1. Stop the current worker (Ctrl+C) and start the worker with failure support:
```bash
python3 workers/worker_with_failing.py
```

### 2. Trigger a failing workflow:
```bash
python3 examples/failing_example.py
```

### 3. Monitor the failure:
```bash
python3 monitoring/list_failed_workflows.py
```

## Temporal Web UI

The easiest way to monitor workflows is through the Web UI:

**URL**: http://localhost:8233

Features:
- Visual workflow history
- Timeline view of activities
- Error messages and stack traces
- Search and filter capabilities
- Retry and terminate workflows

## Common Queries

Filter workflows using query syntax:

```python
# Failed workflows
"ExecutionStatus='Failed'"

# Running workflows
"ExecutionStatus='Running'"

# Completed workflows
"ExecutionStatus='Completed'"

# Workflows by type
"WorkflowType='SayHelloWorkflow'"

# Combined queries
"ExecutionStatus='Failed' AND WorkflowType='SayHelloWorkflow'"
```

## Temporal CLI

If you have the Temporal CLI installed:

```bash
# List all workflows
temporal workflow list

# List failed workflows
temporal workflow list --query "ExecutionStatus='Failed'"

# Show workflow details
temporal workflow show --workflow-id <workflow-id>

# Describe workflow
temporal workflow describe --workflow-id <workflow-id>
```

## Workflow Status Types

- **Running** - Currently executing
- **Completed** - Finished successfully
- **Failed** - Failed after all retries
- **Canceled** - Manually canceled
- **Terminated** - Forcefully terminated
- **TimedOut** - Exceeded timeout
- **ContinuedAsNew** - Restarted with new execution

## Key Concepts

### Activities
- Single, well-defined actions
- Can be short or long-running
- Interact with external systems
- Automatically retried on failure

### Workflows
- Orchestrate activities
- Contain application logic
- Resilient and durable
- Can run for years

### Workers
- Poll task queues for work
- Execute workflows and activities
- Must be running for workflows to execute

## Best Practices

1. **Meaningful Workflow IDs**: Include context in IDs
   ```python
   workflow_id = f"order-{order_id}-{uuid.uuid4()}"
   ```

2. **Appropriate Timeouts**: Configure timeouts based on expected duration
   ```python
   schedule_to_close_timeout=timedelta(minutes=5)
   ```

3. **Retry Policies**: Define retry behavior
   ```python
   retry_policy=workflow.RetryPolicy(
       maximum_attempts=3,
       initial_interval=timedelta(seconds=1),
   )
   ```

4. **Monitor Regularly**: Use the monitoring scripts or Web UI

5. **Handle Errors Gracefully**: Use proper exception handling

## Troubleshooting

### Worker Not Processing
- Verify worker is running
- Check task queue name matches
- Confirm Temporal server is accessible

### Workflows Timing Out
- Increase timeout values
- Check activity completion time
- Verify worker has resources

### Can't Find Workflows
- Check correct namespace (default: "default")
- Verify workflow was started
- Check time range in queries

## Additional Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Python SDK Guide](https://docs.temporal.io/dev-guide/python)
- [docs/MONITORING_GUIDE.md](docs/MONITORING_GUIDE.md) - Detailed monitoring guide
