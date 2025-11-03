"""
Test Email Workflow - Send → Wait → Parse → Escalate/Followup
Tests: Email sending, parsing, wait logic, and escalation decision
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from temporalio.client import Client


async def main():
    print("=" * 70)
    print("🧪 Testing Email Workflow: Send → Parse → Escalate")
    print("=" * 70)
    print()

    # Connect to Temporal
    client = await Client.connect("localhost:7233")

    # Define test workflow
    workflow_definition = {
        "id": f"email-test-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "name": "Email Response Test Workflow",
        "config": {
            "task_queue": "fourkites-workflow-queue"
        },
        "nodes": [
            # Node 1: Send initial email
            {
                "id": "send-email-1",
                "type": "action",
                "activity": "send_email_level1_real",
                "params": {
                    "recipient_email": "msp.raja@fourkites.com",
                    "facility": "Test Facility - Chicago",
                    "shipment_id": "TEST-SHIP-12345",
                    "email_template": "urgent_update",
                    "custom_subject": "TEST: Email Workflow - Please Reply with Delivery Info",
                    "custom_message": "This is a test workflow. Please reply with:\n\n" +
                                     "Tracking: TEST123456\n" +
                                     "Delivery Date: 11/01/2024\n" +
                                     "Status: On Schedule\n\n" +
                                     "This will test our email parsing and escalation logic."
                },
                "next": ["wait-1"]
            },
            # Node 2: Wait 30 seconds for response
            {
                "id": "wait-1",
                "type": "action",
                "activity": "wait_for_duration",
                "params": {
                    "duration": 30,
                    "unit": "seconds"
                },
                "next": ["parse-1"]
            },
            # Node 3: Parse email response
            {
                "id": "parse-1",
                "type": "action",
                "activity": "parse_email_response_real",
                "params": {
                    "auto_fetch": True,
                    "subject_filter": "Re:",
                    "from_email": "msp.raja@fourkites.com",
                    "since_hours": 1
                },
                "next": ["check-completeness-1"]
            },
            # Node 4: Check response completeness
            {
                "id": "check-completeness-1",
                "type": "action",
                "activity": "check_response_completeness",
                "params": {
                    "required_fields": ["tracking_number", "delivery_date", "status"]
                },
                "next": ["decide-1"]
            },
            # Node 5: Determine next action
            {
                "id": "decide-1",
                "type": "action",
                "activity": "determine_escalation_path",
                "params": {
                    "response_status": "partial",
                    "attempt_count": 1
                },
                "next": ["followup-1", "escalate-1"]
            },
            # Node 6a: Send follow-up if incomplete
            {
                "id": "followup-1",
                "type": "action",
                "activity": "send_email_level2_followup_real",
                "params": {
                    "recipient_email": "msp.raja@fourkites.com",
                    "facility": "Test Facility - Chicago",
                    "escalation_level": 2
                },
                "next": []
            },
            # Node 6b: Send escalation if no response
            {
                "id": "escalate-1",
                "type": "action",
                "activity": "send_email_level3_escalation_real",
                "params": {
                    "escalation_recipient": "msp.raja@fourkites.com",
                    "facility": "Test Facility - Chicago",
                    "escalation_level": 3,
                    "reason": "No response received after 30 seconds (test)"
                },
                "next": []
            }
        ]
    }

    print("📧 Test Workflow Configuration:")
    print(f"   Workflow ID: {workflow_definition['id']}")
    print(f"   Total Nodes: {len(workflow_definition['nodes'])}")
    print()
    print("📋 Workflow Steps:")
    print("   1. Send email to msp.raja@fourkites.com")
    print("   2. Wait 30 seconds for reply")
    print("   3. Parse email response from inbox")
    print("   4. Check completeness of extracted data")
    print("   5. Determine escalation path")
    print("   6a. Send follow-up if partial response")
    print("   6b. Send escalation if no response")
    print()
    print("⚠️  ACTION REQUIRED:")
    print("   1. Check your email inbox for the initial email")
    print("   2. Reply within 30 seconds with:")
    print("      Tracking: TEST123456")
    print("      Delivery Date: 11/01/2024")
    print("      Status: On Schedule")
    print()
    print("🔄 Starting workflow execution...")
    print()

    # Execute workflow via HTTP API
    import requests

    try:
        response = requests.post(
            "http://localhost:8001/api/workflows/execute",
            json=workflow_definition,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Workflow started successfully!")
            print(f"   Workflow ID: {result['workflow_id']}")
            print(f"   Run ID: {result['run_id']}")
            print()
            print("🌐 Monitor workflow execution:")
            print(f"   Temporal UI: http://localhost:8233/namespaces/default/workflows/{result['workflow_id']}")
            print()
            print("📊 What to expect:")
            print("   - Email sent immediately")
            print("   - 30 second wait period")
            print("   - Email parsing from your inbox")
            print("   - Decision based on response completeness")
            print("   - Follow-up or escalation email sent")
            print()
        else:
            print(f"❌ Failed to start workflow: {response.status_code}")
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error executing workflow: {str(e)}")

    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
