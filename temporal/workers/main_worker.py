"""
FourKites Production Worker with Real Email Actions

Registers all FourKites action blocks including real Gmail SMTP email sending.
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from temporalio.client import Client
from temporalio.worker import Worker
from temporalio import activity

# Import visual workflow executor with conditional routing
from examples.visual_workflow_builder.backend.dynamic_workflow import (
    VisualWorkflowExecutor
)

# Import all FourKites activities (mock)
from src.activities.fourkites_actions import (
    # Email activities (mock)
    send_email_level1,
    send_email_level2_followup,
    send_email_level3_escalation,
    # Data processing
    receive_and_parse_email,
    # Decision blocks
    check_response_completeness,
    check_escalation_limit,
    # Notifications
    notify_internal_users_questions,
    notify_escalation_limit_reached,
    # Triggers
    check_trigger_condition,
    # Utilities
    increment_escalation_counter,
    log_workflow_action,
    # Registry
    FOURKITES_ACTION_BLOCKS
)

# Import REAL email activities
from src.activities.real_email_actions import (
    send_email_level1_real,
    send_email_level2_followup_real,
    send_email_level3_escalation_real,
    send_test_email_real,
    REAL_EMAIL_ACTION_BLOCKS
)

# Import Gmail inbox activities
from src.activities.gmail_inbox_actions import (
    check_gmail_inbox,
    parse_email_response_real,
    check_response_timeout_real,
)

# Import utility activities
from src.activities.utility_actions import (
    log_activity,
)

# Import document extraction activities
from src.activities.document_extraction_actions import (
    request_document_via_email,
    extract_document_from_email,
    extract_data_from_pdf,
    save_extraction_as_markdown,
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
    """Start the FourKites production worker with real email support"""
    print("="*70)
    print("🚀 FourKites Production Workflow Worker (with Real Email)")
    print("="*70)

    # Connect to Temporal
    client = await Client.connect("localhost:7233")
    print("✅ Connected to Temporal server at localhost:7233")

    # Collect all activities
    activities = [
        # Mock Email (for testing)
        send_email_level1,
        send_email_level2_followup,
        send_email_level3_escalation,
        # REAL Email (Gmail SMTP)
        send_email_level1_real,
        send_email_level2_followup_real,
        send_email_level3_escalation_real,
        send_test_email_real,
        # Gmail Inbox
        check_gmail_inbox,
        parse_email_response_real,
        check_response_timeout_real,
        # Data
        receive_and_parse_email,
        # Decisions
        check_response_completeness,
        check_escalation_limit,
        # Notifications
        notify_internal_users_questions,
        notify_escalation_limit_reached,
        # Triggers
        check_trigger_condition,
        # Utilities
        increment_escalation_counter,
        log_workflow_action,
        log_activity,
        wait_for_duration,
        # Document Extraction
        request_document_via_email,
        extract_document_from_email,
        extract_data_from_pdf,
        save_extraction_as_markdown,
    ]

    # Create worker
    worker = Worker(
        client,
        task_queue="fourkites-workflow-queue",
        workflows=[VisualWorkflowExecutor],
        activities=activities,
    )

    print(f"✅ Worker registered with task queue: fourkites-workflow-queue")
    print(f"✅ Registered workflow: VisualWorkflowExecutor (with conditional routing)")
    print(f"✅ Registered {len(activities)} activities:\n")

    # Print all action blocks by category
    all_blocks = {**FOURKITES_ACTION_BLOCKS, **REAL_EMAIL_ACTION_BLOCKS}
    by_category = {}
    for block_id, block_info in all_blocks.items():
        category = block_info["category"]
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(block_info)

    for category, blocks in sorted(by_category.items()):
        print(f"  📁 {category}:")
        for block in blocks:
            action_count = block["action_count"]
            count_str = f"({action_count} actions)" if isinstance(action_count, int) else "(variable)"
            print(f"     {block['icon']} {block['name']} {count_str}")
        print()

    print("="*70)
    print("🎯 Worker ready! Waiting for workflows from visual builder...")
    print("   Visual Builder UI: http://localhost:5173")
    print("   Temporal Monitor: http://localhost:8233")
    print("   📧 Real Email: ENABLED via Gmail SMTP")
    print("="*70 + "\n")

    # Run worker
    await worker.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n" + "="*70)
        print("👋 FourKites Worker stopped")
        print("="*70)
