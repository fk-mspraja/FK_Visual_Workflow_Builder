"""
Real Email Actions using Gmail SMTP

Production-ready email activities that send actual emails via Gmail SMTP.
"""
import asyncio
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

from temporalio import activity
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# Gmail SMTP Configuration
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_email_via_gmail(
    to_email: str,
    subject: str,
    body_html: str,
    cc_list: list = None
) -> Dict[str, Any]:
    """
    Send email via Gmail SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        body_html: HTML body content
        cc_list: List of CC email addresses

    Returns:
        Dict with send status and details
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = GMAIL_ADDRESS
        msg['To'] = to_email
        msg['Subject'] = subject

        if cc_list:
            msg['Cc'] = ', '.join(cc_list)

        # Attach HTML body
        html_part = MIMEText(body_html, 'html')
        msg.attach(html_part)

        # Connect to Gmail SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)

            # Send email
            recipients = [to_email] + (cc_list or [])
            server.send_message(msg, to_addrs=recipients)

        return {
            "status": "sent",
            "sent_to": to_email,
            "cc": cc_list or [],
            "sent_at": datetime.now().isoformat(),
            "subject": subject
        }

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "sent_to": to_email,
            "attempted_at": datetime.now().isoformat()
        }


# ============================================================================
# EMAIL ACTIVITIES
# ============================================================================

@activity.defn
async def send_email_level1_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 1 - Initial Outreach (REAL EMAIL via Gmail)

    UI Block Name: "Send Initial Email (Real)"
    Category: Email
    Action Count: 1

    Sends actual email via Gmail SMTP server.

    Parameters:
        facility: Facility name/identifier
        recipient_email: Email address to send to
        template: Email template to use (optional)
        cc_list: List of CC email addresses (optional)
        shipment_id: Shipment ID for reference (optional)

    Returns:
        action_count: 1
        status: "sent" or "failed"
        sent_to: Recipient email
        sent_at: Timestamp
        message_id: Generated message ID
    """
    activity.logger.info(f"📧 Sending real email via Gmail SMTP to {params.get('recipient_email')}")

    facility = params.get("facility", "Unknown Facility")
    recipient_email = params.get("recipient_email")
    shipment_id = params.get("shipment_id", "N/A")
    cc_list = params.get("cc_list", [])

    if not recipient_email:
        return {
            "action_count": 1,
            "status": "failed",
            "error": "No recipient email provided",
            "attempted_at": datetime.now().isoformat()
        }

    # Create email content
    subject = f"FourKites: Shipment Information Request - {facility}"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">🚚 FourKites Shipment Update</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello,</p>

                <p>We are reaching out regarding shipment <strong>{shipment_id}</strong> at <strong>{facility}</strong>.</p>

                <p>Could you please provide the following information:</p>
                <ul>
                    <li>Estimated delivery date</li>
                    <li>Current tracking number</li>
                    <li>Any delays or issues</li>
                </ul>

                <p>Please reply to this email with the requested information at your earliest convenience.</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from FourKites Workflow System.<br>
                        Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>FourKites Inc. | Supply Chain Visibility Platform</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Send email
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        send_email_via_gmail,
        recipient_email,
        subject,
        body_html,
        cc_list
    )

    activity.logger.info(f"✅ Email send result: {result['status']}")

    return {
        "action_count": 1,
        "message_id": f"msg-{datetime.now().timestamp()}",
        **result
    }


@activity.defn
async def send_email_level2_followup_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 2 - Follow-up for Incomplete Information (REAL EMAIL)

    UI Block Name: "Send Follow-up Email (Real)"
    Category: Email
    Action Count: 2 (includes AI content generation simulation)

    Parameters:
        facility: Facility name
        recipient_email: Email address
        missing_fields: List of missing information fields
        original_message_id: Reference to original email (optional)
        cc_list: CC list (optional)

    Returns:
        action_count: 2
        status: "sent" or "failed"
        email_content: Generated email body
    """
    activity.logger.info(f"📧 Sending follow-up email via Gmail SMTP")

    facility = params.get("facility", "Unknown Facility")
    recipient_email = params.get("recipient_email")
    missing_fields = params.get("missing_fields", ["delivery_date", "tracking_number"])
    cc_list = params.get("cc_list", [])

    if not recipient_email:
        return {
            "action_count": 2,
            "status": "failed",
            "error": "No recipient email provided"
        }

    # Generate follow-up content (simulating LLM)
    missing_items = "\n".join([f"    <li>{field.replace('_', ' ').title()}</li>" for field in missing_fields])

    subject = f"FourKites: Follow-up - Additional Information Needed - {facility}"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">📧 Follow-up: Information Request</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello,</p>

                <p>Thank you for your response regarding the shipment at <strong>{facility}</strong>.</p>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Additional Information Needed:</strong></p>
                    <p>We still need the following information to proceed:</p>
                    <ul>
                        {missing_items}
                    </ul>
                </div>

                <p>Could you please provide these details at your earliest convenience? This information is crucial for maintaining shipment visibility.</p>

                <p>If you have any questions or concerns, please don't hesitate to reach out.</p>

                <p>Best regards,<br>
                FourKites Logistics Team</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is a follow-up from our automated workflow system.<br>
                        Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    # Send email
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        send_email_via_gmail,
        recipient_email,
        subject,
        body_html,
        cc_list
    )

    activity.logger.info(f"✅ Follow-up email result: {result['status']}")

    return {
        "action_count": 2,
        "message_id": f"msg-{datetime.now().timestamp()}",
        "email_content": body_html,
        **result
    }


@activity.defn
async def send_email_level3_escalation_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 3 - Escalation to Manager/Supervisor (REAL EMAIL)

    UI Block Name: "Send Escalation Email (Real)"
    Category: Email
    Action Count: 1

    Parameters:
        facility: Facility name
        escalation_recipient: Escalation contact email
        escalation_level: Escalation level (1, 2, 3)
        original_recipient: Original contact email
        reason: Escalation reason
        cc_list: CC list (optional)

    Returns:
        action_count: 1
        status: "sent" or "failed"
        escalation_level: Level escalated to
    """
    activity.logger.info(f"🚨 Sending escalation email via Gmail SMTP")

    facility = params.get("facility", "Unknown Facility")
    escalation_recipient = params.get("escalation_recipient")
    escalation_level = params.get("escalation_level", 2)
    original_recipient = params.get("original_recipient", "N/A")
    reason = params.get("reason", "No response to previous requests")
    cc_list = params.get("cc_list", [])

    if not escalation_recipient:
        return {
            "action_count": 1,
            "status": "failed",
            "error": "No escalation recipient provided"
        }

    subject = f"URGENT: Escalation Level {escalation_level} - {facility} Shipment Information"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">🚨 ESCALATION: Shipment Information Needed</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #991b1b;"><strong>⚠️ ESCALATION LEVEL {escalation_level}</strong></p>
                </div>

                <p>Dear Manager/Supervisor,</p>

                <p>This is an <strong>escalated</strong> request regarding shipment information for <strong>{facility}</strong>.</p>

                <div style="background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Escalation Reason:</strong></p>
                    <p style="margin: 10px 0 0 0; color: #666;">{reason}</p>

                    <p style="margin: 15px 0 0 0;"><strong>Original Contact:</strong> {original_recipient}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Escalation Level:</strong> {escalation_level}</p>
                </div>

                <p>We have attempted to contact your facility multiple times without receiving the necessary shipment information. This is causing delays in our supply chain visibility.</p>

                <p><strong>Action Required:</strong></p>
                <ul>
                    <li>Provide estimated delivery date</li>
                    <li>Confirm current tracking number</li>
                    <li>Report any delays or issues</li>
                </ul>

                <p style="background: #fef3c7; padding: 10px; border-radius: 4px;">
                    ⏰ <strong>Urgent:</strong> Please respond within 4 hours to avoid further escalation.
                </p>

                <p>Thank you for your immediate attention to this matter.</p>

                <p>Best regards,<br>
                FourKites Escalation Team</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated escalation from FourKites Workflow System.<br>
                        Escalation Level: {escalation_level} | Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    # Send email
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        send_email_via_gmail,
        escalation_recipient,
        subject,
        body_html,
        cc_list
    )

    activity.logger.info(f"✅ Escalation email result: {result['status']}")

    return {
        "action_count": 1,
        "message_id": f"msg-{datetime.now().timestamp()}",
        "escalation_level": escalation_level,
        "escalated_to": escalation_recipient,
        **result
    }


@activity.defn
async def send_test_email_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Test Email - For testing Gmail SMTP configuration

    UI Block Name: "Send Test Email"
    Category: Email
    Action Count: 1

    Parameters:
        recipient_email: Email address to send test to

    Returns:
        action_count: 1
        status: "sent" or "failed"
    """
    activity.logger.info(f"🧪 Sending test email via Gmail SMTP")

    recipient_email = params.get("recipient_email", GMAIL_ADDRESS)

    subject = "FourKites Workflow Builder - Test Email"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Test Email - FourKites Workflow Builder</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello!</p>

                <p>This is a test email from your FourKites Workflow Builder.</p>

                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>✅ Success!</strong></p>
                    <p style="margin: 10px 0 0 0;">Your Gmail SMTP configuration is working correctly.</p>
                </div>

                <p><strong>Configuration Details:</strong></p>
                <ul>
                    <li>SMTP Server: {SMTP_SERVER}</li>
                    <li>SMTP Port: {SMTP_PORT}</li>
                    <li>From Address: {GMAIL_ADDRESS}</li>
                    <li>Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</li>
                </ul>

                <p>You can now use the real email actions in your workflows!</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is a test message from FourKites Workflow Builder.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    # Send email
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        send_email_via_gmail,
        recipient_email,
        subject,
        body_html,
        None
    )

    activity.logger.info(f"✅ Test email result: {result['status']}")

    return {
        "action_count": 1,
        "message_id": f"msg-test-{datetime.now().timestamp()}",
        **result
    }


# UI Metadata for real email blocks (with clean action IDs)
REAL_EMAIL_ACTION_BLOCKS = {
    "send_initial_email": {
        "name": "Send Initial Email",
        "category": "Email",
        "description": "Send professional outreach email for shipment information",
        "action_count": 1,
        "icon": "📧",
        "color": "#3b82f6",
        "activity_function": "send_email_level1_real",  # Maps to actual activity function
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "recipient_email", "type": "email", "required": True, "description": "Recipient email address"},
            {"name": "shipment_id", "type": "string", "required": False},
            {"name": "cc_list", "type": "array", "required": False},
            {"name": "email_template", "type": "select", "required": False, "options": ["shipment_info_request", "delivery_delay_notice"]},
            {"name": "custom_subject", "type": "string", "required": False},
            {"name": "custom_message", "type": "string", "required": False}
        ]
    },
    "send_followup_email": {
        "name": "Send Follow-up Email",
        "category": "Email",
        "description": "Send follow-up email when information is incomplete",
        "action_count": 2,
        "icon": "📨",
        "color": "#8B5CF6",
        "activity_function": "send_email_level2_followup_real",  # Maps to actual activity function
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "recipient_email", "type": "email", "required": True},
            {"name": "missing_fields", "type": "string", "required": True, "description": "Comma-separated list of missing fields"},
            {"name": "cc_list", "type": "array", "required": False}
        ]
    },
    "send_escalation_email": {
        "name": "Send Escalation Email",
        "category": "Email",
        "description": "Send urgent escalation email to manager/supervisor",
        "action_count": 1,
        "icon": "🚨",
        "color": "#ef4444",
        "activity_function": "send_email_level3_escalation_real",  # Maps to actual activity function
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "escalation_recipient", "type": "email", "required": True, "description": "Manager or supervisor email"},
            {"name": "escalation_level", "type": "integer", "required": True, "description": "Escalation level (1, 2, 3)"},
            {"name": "original_recipient", "type": "email", "required": False},
            {"name": "reason", "type": "string", "required": False},
            {"name": "cc_list", "type": "array", "required": False}
        ]
    },
    "check_email_inbox": {
        "name": "Check Email Inbox",
        "category": "Email",
        "description": "Check Gmail inbox for new emails and replies",
        "action_count": 1,
        "icon": "📬",
        "color": "#3b82f6",
        "activity_function": "check_email_inbox",  # TODO: Implement this activity
        "config_fields": [
            {"name": "subject_filter", "type": "string", "required": False},
            {"name": "from_filter", "type": "email", "required": False},
            {"name": "since_hours", "type": "integer", "required": False, "default": 24},
            {"name": "mark_as_read", "type": "boolean", "required": False, "default": False}
        ]
    },
    "parse_email_response": {
        "name": "Parse Email Response (AI)",
        "category": "Email",
        "description": "AI-powered email parsing to extract delivery info and detect gibberish",
        "action_count": 1,
        "icon": "🤖",
        "color": "#8B5CF6",
        "activity_function": "parse_email_response_ai",  # TODO: Implement this activity
        "config_fields": [
            {"name": "email_body", "type": "string", "required": False},
            {"name": "subject_filter", "type": "string", "required": False},
            {"name": "from_email", "type": "email", "required": False},
            {"name": "auto_fetch", "type": "boolean", "required": False, "default": True},
            {"name": "since_hours", "type": "integer", "required": False}
        ]
    },
    "wait_timer": {
        "name": "Wait Timer",
        "category": "Logic",
        "description": "Wait for specified duration before continuing workflow",
        "action_count": 1,
        "icon": "⏱️",
        "color": "#6B7280",
        "activity_function": "wait_for_duration",  # TODO: Implement this activity
        "config_fields": [
            {"name": "duration", "type": "integer", "required": True, "description": "Duration to wait"},
            {"name": "unit", "type": "select", "required": False, "options": ["minutes", "hours", "days"], "default": "hours"}
        ]
    },
    "conditional_router": {
        "name": "Conditional Router",
        "category": "Logic",
        "description": "Route workflow based on conditions (if/else logic)",
        "action_count": 1,
        "icon": "🔀",
        "color": "#F59E0B",
        "activity_function": "route_by_condition",  # TODO: Implement this activity
        "config_fields": [
            {"name": "condition_field", "type": "string", "required": True, "description": "Field to check"},
            {"name": "operator", "type": "select", "required": True, "options": ["equals", "not_equals", "contains", "greater_than", "less_than"]},
            {"name": "condition_value", "type": "string", "required": True},
            {"name": "true_branch", "type": "string", "required": False},
            {"name": "false_branch", "type": "string", "required": False}
        ],
        "branches": ["complete", "partial", "gibberish"]
    },
    "extract_document_text": {
        "name": "Extract Document Text",
        "category": "Documents",
        "description": "Extract text from PDF or Word documents (BOL, invoices, etc.)",
        "action_count": 1,
        "icon": "📄",
        "color": "#10B981",
        "activity_function": "extract_pdf_text",  # TODO: Implement this activity
        "config_fields": [
            {"name": "document_path", "type": "string", "required": True},
            {"name": "page_numbers", "type": "string", "required": False}
        ]
    },
    "parse_document_with_ai": {
        "name": "Parse Document with AI",
        "category": "Documents",
        "description": "AI-powered document parsing to extract BOL number, delivery date, etc.",
        "action_count": 1,
        "icon": "📋",
        "color": "#8B5CF6",
        "activity_function": "parse_document_ai",  # TODO: Implement this activity
        "config_fields": [
            {"name": "document_text", "type": "string", "required": True},
            {"name": "extraction_fields", "type": "array", "required": False},
            {"name": "format", "type": "select", "required": False, "options": ["json", "csv"]}
        ]
    }
}
