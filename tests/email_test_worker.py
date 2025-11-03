"""
Email Test Worker - Registers EmailTestWorkflow and email activities
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from temporalio.client import Client
from temporalio.worker import Worker

# Import workflow
from email_test_workflow import EmailTestWorkflow

# Import activities
from src.activities.real_email_actions import (
    send_email_level1_real,
    send_email_level2_followup_real,
    send_email_level3_escalation_real,
)
from src.activities.gmail_inbox_actions import (
    check_gmail_inbox,
    parse_email_response_real,
    check_response_timeout_real,
)


async def main():
    print("=" * 70)
    print("Email Test Worker - Temporal Orchestration")
    print("=" * 70)
    print()

    # Connect to Temporal
    client = await Client.connect("localhost:7233")
    print("✓ Connected to Temporal server at localhost:7233")

    # Task queue for this test
    task_queue = "email-test-queue"
    print(f"✓ Worker registered with task queue: {task_queue}")
    print()

    # Register activities
    activities = [
        send_email_level1_real,
        send_email_level2_followup_real,
        send_email_level3_escalation_real,
        check_gmail_inbox,
        parse_email_response_real,
        check_response_timeout_real,
    ]

    print("✓ Registered activities:")
    for activity in activities:
        print(f"   - {activity.__name__}")
    print()

    print("✓ Registered workflow:")
    print(f"   - EmailTestWorkflow")
    print()

    # Create and run worker
    worker = Worker(
        client,
        task_queue=task_queue,
        workflows=[EmailTestWorkflow],
        activities=activities,
    )

    print("=" * 70)
    print("Worker ready! Waiting for workflow executions...")
    print()
    print("To execute the test workflow, run:")
    print("   python3 run_email_test_workflow.py")
    print()
    print(f"Monitor execution at:")
    print(f"   http://localhost:8233")
    print("=" * 70)
    print()

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
