"""
Email Test Workflow - Temporal Orchestrated
Simple workflow: Send → Wait → Parse → Escalate/Followup
"""
from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from src.activities.real_email_actions import (
        send_email_level1_real,
        send_email_level2_followup_real,
        send_email_level3_escalation_real,
    )
    from src.activities.gmail_inbox_actions import parse_email_response_real


@workflow.defn
class EmailTestWorkflow:
    """
    Test workflow that sends email, waits for response, parses it,
    and sends follow-up or escalation based on completeness.
    """

    @workflow.run
    async def run(self, params: dict) -> dict:
        """
        Execute email test workflow

        Args:
            params: {
                "recipient_email": str,
                "facility": str,
                "shipment_id": str,
                "wait_seconds": int (default: 45)
            }
        """
        workflow.logger.info("=" * 70)
        workflow.logger.info("Starting Email Test Workflow")
        workflow.logger.info("=" * 70)

        recipient = params.get("recipient_email", "msp.raja@fourkites.com")
        facility = params.get("facility", "Test Facility - Chicago")
        shipment_id = params.get("shipment_id", "TEST-SHIP-12345")
        wait_seconds = params.get("wait_seconds", 45)

        # Activity options with retry policy
        activity_options = {
            "start_to_close_timeout": timedelta(seconds=120),
            "retry_policy": RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(seconds=1),
                maximum_interval=timedelta(seconds=10),
            ),
        }

        # Step 1: Send initial email
        workflow.logger.info("Step 1: Sending initial email...")
        send_params = {
            "recipient_email": recipient,
            "facility": facility,
            "shipment_id": shipment_id,
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
            ),
        }

        send_result = await workflow.execute_activity(
            send_email_level1_real,
            send_params,
            **activity_options,
        )

        workflow.logger.info(f"Email sent successfully! Status: {send_result.get('status')}")

        # Step 2: Wait for response
        workflow.logger.info(f"Step 2: Waiting {wait_seconds} seconds for reply...")
        await workflow.sleep(wait_seconds)

        # Step 3: Parse email response
        workflow.logger.info("Step 3: Parsing email response from inbox...")
        parse_params = {
            "auto_fetch": True,
            "subject_filter": "Re:",
            "from_email": recipient,
            "since_hours": 1,
        }

        parse_result = await workflow.execute_activity(
            parse_email_response_real,
            parse_params,
            **activity_options,
        )

        workflow.logger.info(f"Email parsing completed! Status: {parse_result.get('status')}")
        workflow.logger.info(f"Completeness: {parse_result.get('completeness')}")

        # Step 4: Determine next action based on response
        completeness = parse_result.get("completeness")
        status = parse_result.get("status")

        if status == "no_emails_found":
            workflow.logger.info("No response email found - sending escalation...")
            escalation_params = {
                "escalation_recipient": recipient,
                "facility": facility,
                "escalation_level": 3,
                "reason": f"No response received after {wait_seconds} seconds (test)",
            }

            escalation_result = await workflow.execute_activity(
                send_email_level3_escalation_real,
                escalation_params,
                **activity_options,
            )

            workflow.logger.info("Escalation email sent!")
            return {
                "workflow_status": "completed_with_escalation",
                "send_result": send_result,
                "parse_result": parse_result,
                "escalation_result": escalation_result,
            }

        elif completeness == "complete":
            workflow.logger.info("All required information received! No follow-up needed.")
            return {
                "workflow_status": "completed_successfully",
                "send_result": send_result,
                "parse_result": parse_result,
            }

        elif completeness == "partial":
            workflow.logger.info("Partial information received - sending follow-up...")
            missing_fields = parse_result.get("missing_fields", [])
            workflow.logger.info(f"Missing fields: {', '.join(missing_fields)}")

            followup_params = {
                "recipient_email": recipient,
                "facility": facility,
                "escalation_level": 2,
                "missing_fields": missing_fields,
            }

            followup_result = await workflow.execute_activity(
                send_email_level2_followup_real,
                followup_params,
                **activity_options,
            )

            workflow.logger.info("Follow-up email sent!")
            return {
                "workflow_status": "completed_with_followup",
                "send_result": send_result,
                "parse_result": parse_result,
                "followup_result": followup_result,
            }

        else:
            workflow.logger.info("Incomplete response - sending escalation...")
            escalation_params = {
                "escalation_recipient": recipient,
                "facility": facility,
                "escalation_level": 3,
                "reason": "Incomplete response received (test)",
            }

            escalation_result = await workflow.execute_activity(
                send_email_level3_escalation_real,
                escalation_params,
                **activity_options,
            )

            workflow.logger.info("Escalation email sent!")
            return {
                "workflow_status": "completed_with_escalation",
                "send_result": send_result,
                "parse_result": parse_result,
                "escalation_result": escalation_result,
            }
