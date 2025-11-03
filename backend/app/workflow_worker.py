"""
Visual Workflow Builder - Temporal Worker
Registers DynamicWorkflowExecutor and all action activities
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from temporalio.client import Client
from temporalio.worker import Worker
from temporalio import activity

# Import workflow
from dynamic_workflow import VisualWorkflowExecutor

# Import all activities from actual files
from src.activities.real_email_actions import (
    send_email_level1_real,
    send_email_level2_followup_real,
    send_email_level3_escalation_real,
    send_test_email_real,
)
from src.activities.gmail_inbox_actions import (
    check_gmail_inbox,
    parse_email_response_real,
    check_response_timeout_real,
)
from src.activities.document_extraction_actions import (
    request_document_via_email,
    extract_document_from_email,
    extract_data_from_pdf,
    save_extraction_as_markdown,
)
from src.activities.utility_actions import (
    log_workflow_action,
    log_activity,
)


@activity.defn
async def wait_for_duration(params: dict) -> dict:
    """Simple wait/sleep activity"""
    duration = params.get('duration', 1)
    unit = params.get('unit', 'hours')

    # Convert to seconds
    duration_seconds = duration
    if unit == 'minutes':
        duration_seconds = duration * 60
    elif unit == 'hours':
        duration_seconds = duration * 3600
    elif unit == 'days':
        duration_seconds = duration * 86400

    # Sleep for the duration
    await asyncio.sleep(duration_seconds)

    return {
        'status': 'completed',
        'waited_duration': duration,
        'unit': unit,
        'seconds': duration_seconds
    }


async def main():
    print("=" * 70)
    print("🚀 Visual Workflow Builder - Temporal Worker")
    print("=" * 70)

    # Connect to Temporal
    client = await Client.connect("localhost:7233")
    print("✅ Connected to Temporal server at localhost:7233")

    # Task queue name
    task_queue = "fourkites-workflow-queue"
    print(f"✅ Worker registered with task queue: {task_queue}")

    # Register all available activities
    activities = [
        # Real email (Gmail SMTP)
        send_email_level1_real,
        send_email_level2_followup_real,
        send_email_level3_escalation_real,
        send_test_email_real,
        # Gmail inbox
        check_gmail_inbox,
        parse_email_response_real,
        check_response_timeout_real,
        # Document extraction (BOL/Invoice)
        request_document_via_email,
        extract_document_from_email,
        extract_data_from_pdf,
        save_extraction_as_markdown,
        # Utility
        log_workflow_action,
        log_activity,
        wait_for_duration,
    ]

    print("✅ Registered activities:")
    for activity in activities:
        print(f"   - {activity.__name__}")

    # Create and run worker
    worker = Worker(
        client,
        task_queue=task_queue,
        workflows=[VisualWorkflowExecutor],
        activities=activities,
    )

    print("=" * 70)
    print("🎯 Worker ready! Waiting for workflows...")
    print(f"   Visual Builder UI: http://localhost:3003")
    print(f"   Backend API: http://localhost:8001")
    print(f"   Temporal UI: http://localhost:8233")
    print("=" * 70)
    print()

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
