"""
Execute Email Test Workflow through Temporal
Sends email → Waits → Parses → Escalates/Follows-up
"""
import asyncio
from datetime import datetime
from temporalio.client import Client

from email_test_workflow import EmailTestWorkflow


async def main():
    print("=" * 70)
    print("Email Test Workflow - Temporal Execution")
    print("=" * 70)
    print()

    # Connect to Temporal
    client = await Client.connect("localhost:7233")
    print("✓ Connected to Temporal server")
    print()

    # Workflow parameters
    workflow_id = f"email-test-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    params = {
        "recipient_email": "msp.raja@fourkites.com",
        "facility": "Test Facility - Chicago",
        "shipment_id": f"TEST-SHIP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "wait_seconds": 45,  # Wait 45 seconds for reply
    }

    print("Workflow Configuration:")
    print(f"   Workflow ID: {workflow_id}")
    print(f"   Recipient: {params['recipient_email']}")
    print(f"   Facility: {params['facility']}")
    print(f"   Shipment ID: {params['shipment_id']}")
    print(f"   Wait Time: {params['wait_seconds']} seconds")
    print()

    print("Workflow Steps:")
    print("   1. Send email to msp.raja@fourkites.com")
    print("   2. Wait 45 seconds for reply")
    print("   3. Parse email response from inbox")
    print("   4. Check completeness of extracted data")
    print("   5. Send follow-up (partial) or escalation (none/incomplete)")
    print()

    print("ACTION REQUIRED:")
    print("   1. Check your email inbox for the test message")
    print("   2. Reply within 45 seconds with:")
    print("      Tracking: TEST123456")
    print("      Delivery Date: 11/01/2024")
    print("      Status: On Schedule")
    print()

    print("Starting workflow execution...")
    print()

    try:
        # Execute workflow
        handle = await client.start_workflow(
            EmailTestWorkflow.run,
            params,
            id=workflow_id,
            task_queue="email-test-queue",
        )

        print("✓ Workflow started successfully!")
        print()
        print(f"Workflow ID: {handle.id}")
        print(f"Run ID: {handle.result_run_id}")
        print()
        print("Monitor execution in Temporal UI:")
        print(f"   http://localhost:8233/namespaces/default/workflows/{handle.id}/{handle.result_run_id}")
        print()
        print("Waiting for workflow to complete...")
        print("(This will take ~45 seconds + email processing time)")
        print()

        # Wait for result
        result = await handle.result()

        print("=" * 70)
        print("Workflow Completed!")
        print("=" * 70)
        print()
        print(f"Status: {result.get('workflow_status')}")
        print()

        if result.get('send_result'):
            print("Email Sending:")
            print(f"   Status: {result['send_result'].get('status')}")
            print(f"   Sent at: {result['send_result'].get('sent_at')}")
            print()

        if result.get('parse_result'):
            parse = result['parse_result']
            print("Email Parsing:")
            print(f"   Status: {parse.get('status')}")
            print(f"   Completeness: {parse.get('completeness')}")
            if parse.get('tracking_number'):
                print(f"   Tracking: {parse.get('tracking_number')}")
            if parse.get('delivery_date'):
                print(f"   Delivery Date: {parse.get('delivery_date')}")
            if parse.get('status'):
                print(f"   Status: {parse.get('status')}")
            if parse.get('missing_fields'):
                print(f"   Missing: {', '.join(parse['missing_fields'])}")
            print()

        if result.get('followup_result'):
            print("Follow-up Email:")
            print(f"   Status: {result['followup_result'].get('status')}")
            print()

        if result.get('escalation_result'):
            print("Escalation Email:")
            print(f"   Status: {result['escalation_result'].get('status')}")
            print()

        print("=" * 70)

    except Exception as e:
        print(f"✗ Error executing workflow: {str(e)}")
        print()
        print("Troubleshooting:")
        print("   1. Ensure email_test_worker.py is running")
        print("   2. Check Temporal server is running (localhost:7233)")
        print("   3. Verify Gmail credentials in .env file")
        print()


if __name__ == "__main__":
    asyncio.run(main())
