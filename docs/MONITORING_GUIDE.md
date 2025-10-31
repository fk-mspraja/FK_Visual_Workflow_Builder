# Temporal Workflow Monitoring Guide

## Quick Reference

### View All Workflows
```bash
python3 list_workflows.py
```

### View Only Failed Workflows
```bash
python3 list_failed_workflows.py
```

### View Specific Workflow Details
```bash
python3 get_workflow_details.py <workflow-id>
```

### Test Failure Handling
```bash
# First, stop the old worker and start the new one that supports failing workflows
# In the worker terminal: Ctrl+C, then run:
python3 worker_with_failing.py

# In another terminal, trigger a failing workflow:
python3 failing_example.py
```

---

## Monitoring Methods

### 1. Temporal Web UI (Recommended)
The easiest way to monitor workflows is through the Temporal Web UI:

- **URL**: http://localhost:8233
- **Features**:
  - Visual workflow history
  - Timeline view of activities
  - Error messages and stack traces
  - Search and filter capabilities
  - Retry and terminate workflows

### 2. Temporal CLI
If you have the Temporal CLI installed:

```bash
# List all workflows
temporal workflow list

# List failed workflows
temporal workflow list --query "ExecutionStatus='Failed'"

# Show specific workflow details
temporal workflow show --workflow-id <workflow-id>

# Describe workflow execution
temporal workflow describe --workflow-id <workflow-id>

# Get workflow history
temporal workflow show --workflow-id <workflow-id> --output json
```

### 3. Python SDK (Programmatic)
Use the provided Python scripts for programmatic access.

---

## Workflow Query Syntax

You can filter workflows using the `query` parameter:

### Common Queries

```python
# Failed workflows
query = "ExecutionStatus='Failed'"

# Running workflows
query = "ExecutionStatus='Running'"

# Completed workflows
query = "ExecutionStatus='Completed'"

# Workflows by type
query = "WorkflowType='SayHelloWorkflow'"

# Workflows started after a specific time
query = "StartTime > '2024-01-01T00:00:00Z'"

# Combined queries
query = "ExecutionStatus='Failed' AND WorkflowType='SayHelloWorkflow'"
```

### Workflow Status Types
- `Running` - Currently executing
- `Completed` - Finished successfully
- `Failed` - Failed after all retries
- `Canceled` - Manually canceled
- `Terminated` - Forcefully terminated
- `TimedOut` - Exceeded timeout
- `ContinuedAsNew` - Restarted with new execution

---

## Monitoring Script Details

### list_workflows.py
Lists all workflow executions with status indicators:
- 🔄 Running
- ✅ Completed
- ❌ Failed
- 🚫 Canceled
- ⛔ Terminated
- ⏰ Timed Out

### list_failed_workflows.py
Shows only failed workflows with:
- Workflow ID and type
- Start and close times
- Error type and message

### get_workflow_details.py
Provides detailed information about a specific workflow:
- Execution timeline
- Status and result
- History length
- Full error details if failed

---

## Handling Workflow Failures

### Retry Policies
Configure retry behavior in your workflows:

```python
@workflow.run
async def run(self, value: int) -> int:
    return await workflow.execute_activity(
        my_activity,
        value,
        schedule_to_close_timeout=timedelta(seconds=10),
        retry_policy=workflow.RetryPolicy(
            maximum_attempts=5,           # Max retry attempts
            initial_interval=timedelta(seconds=1),  # Initial wait
            maximum_interval=timedelta(seconds=60), # Max wait
            backoff_coefficient=2.0,      # Exponential backoff
            non_retryable_error_types=["ValueError"],  # Don't retry these
        ),
    )
```

### Error Handling in Activities
```python
from temporalio import activity
from temporalio.exceptions import ApplicationError

@activity.defn
async def my_activity(value: int) -> int:
    try:
        # Your activity logic
        result = perform_operation(value)
        return result
    except ValueError as e:
        # Non-retryable error
        raise ApplicationError(
            f"Invalid value: {e}",
            non_retryable=True
        )
    except Exception as e:
        # Retryable error
        raise ApplicationError(f"Operation failed: {e}")
```

---

## Best Practices

1. **Use Meaningful Workflow IDs**: Include timestamps or UUIDs
   ```python
   workflow_id = f"order-processing-{order_id}-{uuid.uuid4()}"
   ```

2. **Monitor Regularly**: Set up automated monitoring for failed workflows

3. **Configure Appropriate Timeouts**:
   - `schedule_to_close_timeout`: Total time for activity
   - `start_to_close_timeout`: Time from start to completion
   - `schedule_to_start_timeout`: Time waiting to be picked up

4. **Log Important Information**: Use workflow logging
   ```python
   import logging
   logger = logging.getLogger(__name__)

   @activity.defn
   async def my_activity(value: int):
       logger.info(f"Processing value: {value}")
   ```

5. **Use Search Attributes**: Add custom metadata for better filtering
   ```python
   await client.execute_workflow(
       MyWorkflow.run,
       args,
       id=workflow_id,
       task_queue="my-queue",
       search_attributes={
           "CustomerId": customer_id,
           "OrderId": order_id,
       }
   )
   ```

---

## Troubleshooting

### Worker Not Processing Workflows
- Check worker is running
- Verify task queue name matches
- Check Temporal server connection

### Workflows Timing Out
- Increase timeout values
- Check worker has enough resources
- Verify activities complete within timeout

### Activities Always Failing
- Check activity code for bugs
- Verify external dependencies are available
- Review retry policy configuration

### Can't Find Workflows
- Check namespace (default is "default")
- Verify workflow was actually started
- Check time range in queries
