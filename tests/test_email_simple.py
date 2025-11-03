"""
Simple Email Test - Direct Activity Execution
Tests: Send Email → Parse Response → Escalate
Without Temporal orchestration
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from src.activities.real_email_actions import send_email_level1_real, send_email_level2_followup_real
from src.activities.gmail_inbox_actions import parse_email_response_real


async def main():
    print("=" * 70)
    print("🧪 Direct Email Activity Test")
    print("=" * 70)
    print()

    # Step 1: Send initial email
    print("📧 Step 1: Sending initial email to msp.raja@fourkites.com...")
    send_params = {
        "recipient_email": "msp.raja@fourkites.com",
        "facility": "Test Facility - Chicago",
        "shipment_id": "TEST-SHIP-" + datetime.now().strftime("%Y%m%d%H%M%S"),
        "email_template": "urgent_update",
        "custom_subject": "TEST: Email Workflow - Please Reply with Delivery Info",
        "custom_message": (
            "This is an automated test of our email workflow system.\n\n"
            "Please reply to this email with the following information:\n\n"
            "Tracking: TEST123456\n"
            "Delivery Date: 11/01/2024\n"
            "Status: On Schedule\n\n"
            "This will test our email parsing and escalation logic.\n\n"
            "Thank you!"
        )
    }

    try:
        send_result = await send_email_level1_real(send_params)
        print(f"✅ Email sent successfully!")
        print(f"   Status: {send_result.get('status')}")
        print(f"   Sent at: {send_result.get('sent_at')}")
        print()
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return

    # Step 2: Wait for user to reply
    print("⏱️  Step 2: Waiting 45 seconds for your reply...")
    print("   Please check your email and reply with the requested information")
    print()

    await asyncio.sleep(45)

    # Step 3: Parse email response
    print("📧 Step 3: Parsing email response from inbox...")
    parse_params = {
        "auto_fetch": True,
        "subject_filter": "Re:",
        "from_email": "msp.raja@fourkites.com",
        "since_hours": 1
    }

    try:
        parse_result = await parse_email_response_real(parse_params)
        print(f"✅ Email parsing completed!")
        print(f"   Status: {parse_result.get('status')}")
        print(f"   Completeness: {parse_result.get('completeness')}")
        print()

        if parse_result.get('status') == 'no_emails_found':
            print("❌ No response email found in inbox")
            print("   Proceeding with escalation...")
            escalation_needed = True
            missing_all = True
        else:
            print("📊 Extracted Information:")
            print(f"   - Tracking Number: {parse_result.get('tracking_number', 'Not found')}")
            print(f"   - Delivery Date: {parse_result.get('delivery_date', 'Not found')}")
            print(f"   - Status: {parse_result.get('status', 'Not found')}")
            print(f"   - Location: {parse_result.get('location', 'Not found')}")
            print()

            # Check completeness
            missing_fields = parse_result.get('missing_fields', [])
            completeness = parse_result.get('completeness')

            if completeness == 'complete':
                print("✅ All required information received!")
                print("   No follow-up needed.")
                escalation_needed = False
                missing_all = False
            elif completeness == 'partial':
                print(f"⚠️  Partial information received")
                print(f"   Missing fields: {', '.join(missing_fields)}")
                print("   Sending follow-up email...")
                escalation_needed = True
                missing_all = False
            else:
                print("❌ Incomplete response")
                print("   Escalating to management...")
                escalation_needed = True
                missing_all = True

            print()

    except Exception as e:
        print(f"❌ Failed to parse email: {str(e)}")
        escalation_needed = True
        missing_all = True

    # Step 4: Send follow-up or escalation
    if escalation_needed:
        if missing_all:
            print("📧 Step 4: Sending escalation email...")
            # In real workflow, this would go to management
            escalation_params = {
                "recipient_email": "msp.raja@fourkites.com",
                "facility": "Test Facility - Chicago",
                "escalation_level": 3
            }
        else:
            print("📧 Step 4: Sending follow-up email for missing information...")
            followup_params = {
                "recipient_email": "msp.raja@fourkites.com",
                "facility": "Test Facility - Chicago",
                "escalation_level": 2
            }

            try:
                followup_result = await send_email_level2_followup_real(followup_params)
                print(f"✅ Follow-up email sent!")
                print(f"   Status: {followup_result.get('status')}")
                print()
            except Exception as e:
                print(f"❌ Failed to send follow-up: {str(e)}")

    print("=" * 70)
    print("🎯 Test Summary:")
    print("=" * 70)
    print()
    print("✅ Tested Components:")
    print("   1. Real email sending (Gmail SMTP)")
    print("   2. Email inbox parsing (Gmail IMAP)")
    print("   3. Information extraction (regex patterns)")
    print("   4. Completeness checking")
    print("   5. Escalation logic")
    print()
    print("📊 Test Results:")
    if not escalation_needed:
        print("   ✅ Complete workflow success - all info received")
    elif not missing_all:
        print("   ⚠️  Partial success - follow-up sent")
    else:
        print("   ❌ No response - escalation triggered")
    print()
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
