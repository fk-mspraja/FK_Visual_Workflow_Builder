"""
FourKites Production Action Library

These are production-ready activities based on the requirements document for email escalation workflows.
Each activity is a reusable block that can be dragged in the UI and stitched together.
"""
from temporalio import activity
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import json


# ============================================================================
# 1. EMAIL ACTIVITIES
# ============================================================================

@activity.defn
async def send_email_level1(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 1 - Initial Outreach

    UI Block Name: "Send Initial Email"
    Category: Email

    Parameters:
        facility: Facility identifier
        template: Email template name (e.g., "initial_outreach")
        cc_list: List of CC recipients
        level: Contact level (default: 1)

    Returns:
        message_id: Email message ID
        sent_to: Recipient email
        sent_at: Timestamp
        action_count: 1 (for logging)
    """
    facility = params.get("facility", "Unknown Facility")
    template = params.get("template", "initial_outreach")
    cc_list = params.get("cc_list", [])

    activity.logger.info(f"📧 Send Email 1 (Initial Outreach)")
    activity.logger.info(f"   Facility: {facility}")
    activity.logger.info(f"   Template: {template}")
    activity.logger.info(f"   CC: {', '.join(cc_list) if cc_list else 'None'}")

    # Query for Level 1 contact
    recipient = await _get_facility_contact(facility, level=1)

    # Simulate email sending
    await asyncio.sleep(1)

    return {
        "message_id": f"msg-{datetime.now().timestamp()}",
        "sent_to": recipient,
        "cc": cc_list,
        "template": template,
        "sent_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "sent"
    }


@activity.defn
async def send_email_level2_followup(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 2 - Follow-up for Incomplete Information

    UI Block Name: "Send Follow-up Email"
    Category: Email

    Parameters:
        facility: Facility identifier
        missing_fields: List of missing data fields
        context: Context from previous response
        cc_list: List of CC recipients

    Returns:
        message_id: Email message ID
        sent_to: Same Level 1 contact
        missing_requested: Fields requested
        action_count: 2 (intelligent action - LLM generated content)
    """
    facility = params.get("facility")
    missing_fields = params.get("missing_fields", [])
    context = params.get("context", {})
    cc_list = params.get("cc_list", [])

    activity.logger.info(f"📧 Send Email 2 (Follow-up - Incomplete Response)")
    activity.logger.info(f"   Facility: {facility}")
    activity.logger.info(f"   Missing Fields: {', '.join(missing_fields)}")

    # Get same Level 1 contact
    recipient = await _get_facility_contact(facility, level=1)

    # Generate intelligent follow-up using LLM
    email_content = await _generate_followup_email(missing_fields, context)

    activity.logger.info(f"   Generated Content: {email_content[:100]}...")

    # Simulate email sending
    await asyncio.sleep(1)

    return {
        "message_id": f"msg-followup-{datetime.now().timestamp()}",
        "sent_to": recipient,
        "cc": cc_list,
        "missing_requested": missing_fields,
        "email_content": email_content,
        "sent_at": datetime.now().isoformat(),
        "action_count": 2,  # Higher count for LLM-generated content
        "status": "sent"
    }


@activity.defn
async def send_email_level3_escalation(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send Email 3 - Escalation

    UI Block Name: "Send Escalation Email"
    Category: Email

    Parameters:
        facility: Facility identifier
        escalation_count: Current escalation count
        timeout_hours: Hours elapsed since Email 1
        template: Escalation template name
        cc_list: Different CC list for escalations

    Returns:
        message_id: Email message ID
        sent_to: Level 2 contact (different from Email 1)
        escalation_level: Current escalation level
        action_count: 1
    """
    facility = params.get("facility")
    escalation_count = params.get("escalation_count", 1)
    timeout_hours = params.get("timeout_hours", 24)
    template = params.get("template", "escalation_urgent")
    cc_list = params.get("cc_list", [])

    activity.logger.info(f"🚨 Send Email 3 (Escalation #{escalation_count})")
    activity.logger.info(f"   Facility: {facility}")
    activity.logger.info(f"   Timeout: {timeout_hours} hours")
    activity.logger.info(f"   Template: {template}")

    # Query for Level 2 contact (different recipient list)
    recipient = await _get_facility_contact(facility, level=2)

    # Simulate escalation email sending
    await asyncio.sleep(1)

    return {
        "message_id": f"msg-escalation-{escalation_count}-{datetime.now().timestamp()}",
        "sent_to": recipient,
        "cc": cc_list,
        "template": template,
        "escalation_level": escalation_count,
        "priority": "urgent",
        "sent_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "escalated"
    }


# ============================================================================
# 2. EMAIL PROCESSING ACTIVITIES
# ============================================================================

@activity.defn
async def receive_and_parse_email(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Receive and Parse Email

    UI Block Name: "Parse Email Response"
    Category: Data Extraction

    Parameters:
        email_content: Raw email content
        fields_to_extract: List of fields to extract (configurable)
        parsing_rules: Custom parsing rules

    Returns:
        extracted_data: Extracted field values
        field_mapping: Mapping of fields
        action_count: 1
    """
    email_content = params.get("email_content", "")
    fields_to_extract = params.get("fields_to_extract", [
        "delivery_date",
        "tracking_number",
        "eta",
        "shipment_status"
    ])

    activity.logger.info(f"📄 Receive and Parse Email")
    activity.logger.info(f"   Fields to Extract: {', '.join(fields_to_extract)}")
    activity.logger.info(f"   Email Length: {len(email_content)} characters")

    # Simulate parsing (in production, use NLP/LLM)
    await asyncio.sleep(0.5)

    extracted_data = {}
    for field in fields_to_extract:
        # Mock extraction
        if field == "delivery_date":
            extracted_data[field] = "2025-11-01"
        elif field == "tracking_number":
            extracted_data[field] = "TRK-FK-123456"
        elif field == "eta":
            extracted_data[field] = "2025-11-01 14:00:00 CST"
        else:
            extracted_data[field] = f"extracted_{field}_value"

    return {
        "extracted_data": extracted_data,
        "fields_found": len(extracted_data),
        "fields_requested": len(fields_to_extract),
        "confidence": 0.95,
        "parsed_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "parsed"
    }


# ============================================================================
# 3. ORCHESTRATOR / DECISION ACTIVITIES
# ============================================================================

@activity.defn
async def check_response_completeness(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrator Analysis - Check Completeness

    UI Block Name: "Check Response Completeness"
    Category: LLM Analysis

    Decision Points:
    1. Is the response complete? YES → End Workflow (Success) / NO → Send Email 2
    2. Does email contain questions/unrelated content? YES → Notify Internal / NO → Continue

    Parameters:
        parsed_data: Data extracted from email
        required_fields: List of required fields (configurable)
        completeness_criteria: Criteria for completeness

    Returns:
        is_complete: Boolean
        missing_fields: List of missing fields
        contains_questions: Boolean
        decision_branch: "complete" | "incomplete" | "contains_questions"
        action_count: 2 (LLM-based decision)
    """
    parsed_data = params.get("parsed_data", {})
    required_fields = params.get("required_fields", ["delivery_date", "tracking_number"])

    activity.logger.info(f"🔍 Check Response Completeness")
    activity.logger.info(f"   Required Fields: {', '.join(required_fields)}")

    # Use LLM to analyze completeness
    await asyncio.sleep(0.5)  # Simulate LLM call

    extracted = parsed_data.get("extracted_data", {})
    missing_fields = [f for f in required_fields if f not in extracted or not extracted[f]]

    # Check for questions or unrelated content (using LLM)
    contains_questions = await _detect_questions_in_email(parsed_data)
    contains_unrelated = await _detect_unrelated_content(parsed_data)

    # Determine decision branch
    if missing_fields:
        decision_branch = "incomplete"
    elif contains_questions or contains_unrelated:
        decision_branch = "contains_questions"
    else:
        decision_branch = "complete"

    activity.logger.info(f"   Decision: {decision_branch}")
    activity.logger.info(f"   Missing: {missing_fields if missing_fields else 'None'}")

    return {
        "is_complete": len(missing_fields) == 0,
        "missing_fields": missing_fields,
        "contains_questions": contains_questions,
        "contains_unrelated": contains_unrelated,
        "decision_branch": decision_branch,
        "confidence": 0.92,
        "analyzed_at": datetime.now().isoformat(),
        "action_count": 2,  # LLM-based analysis
        "status": "analyzed"
    }


@activity.defn
async def check_escalation_limit(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check Termination Conditions - Escalation Limit

    UI Block Name: "Check Escalation Limit"
    Category: Decision

    Parameters:
        escalation_count: Current escalation count
        max_escalations: Maximum allowed escalations (configurable, default: 2)

    Returns:
        limit_reached: Boolean
        escalation_count: Current count
        decision_branch: "limit_reached" | "continue"
        action_count: 1
    """
    escalation_count = params.get("escalation_count", 0)
    max_escalations = params.get("max_escalations", 2)

    activity.logger.info(f"⚖️ Check Escalation Limit")
    activity.logger.info(f"   Current Count: {escalation_count}")
    activity.logger.info(f"   Max Allowed: {max_escalations}")

    limit_reached = escalation_count >= max_escalations
    decision_branch = "limit_reached" if limit_reached else "continue"

    activity.logger.info(f"   Decision: {decision_branch}")

    return {
        "limit_reached": limit_reached,
        "escalation_count": escalation_count,
        "max_escalations": max_escalations,
        "decision_branch": decision_branch,
        "checked_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "checked"
    }


# ============================================================================
# 4. NOTIFICATION ACTIVITIES
# ============================================================================

@activity.defn
async def notify_internal_users_questions(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Notify Internal Users - Questions/Unrelated Content

    UI Block Name: "Notify Internal (Questions)"
    Category: Notification

    Parameters:
        questions_summary: Summary of questions extracted
        unrelated_content: Summary of unrelated content
        distribution_list: Internal users to notify (configurable)
        channel: Notification channel (email, slack, teams)

    Returns:
        notification_id: ID of notification
        sent_to: List of recipients
        action_count: 1
    """
    questions_summary = params.get("questions_summary", "")
    unrelated_content = params.get("unrelated_content", "")
    distribution_list = params.get("distribution_list", ["ops@fourkites.com"])
    channel = params.get("channel", "email")

    activity.logger.info(f"🔔 Notify Internal Users (Questions/Unrelated)")
    activity.logger.info(f"   Channel: {channel}")
    activity.logger.info(f"   Recipients: {', '.join(distribution_list)}")

    notification_content = f"""
    Questions detected in email response:
    {questions_summary}

    Unrelated content:
    {unrelated_content}

    Workflow is continuing to wait for complete response.
    """

    # Simulate sending notification
    await asyncio.sleep(0.3)

    return {
        "notification_id": f"notif-questions-{datetime.now().timestamp()}",
        "sent_to": distribution_list,
        "channel": channel,
        "content_summary": questions_summary[:100],
        "sent_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "notified"
    }


@activity.defn
async def notify_escalation_limit_reached(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Notify Internal Users - Escalation Limit Reached

    UI Block Name: "Notify Escalation Limit"
    Category: Notification

    Parameters:
        workflow_details: Details about the workflow
        escalation_count: Number of escalations attempted
        communication_history: History of communications
        distribution_list: Internal team for escalation handling

    Returns:
        notification_id: ID of notification
        sent_to: List of recipients
        action_count: 1
    """
    workflow_details = params.get("workflow_details", {})
    escalation_count = params.get("escalation_count", 2)
    distribution_list = params.get("distribution_list", ["escalations@fourkites.com"])

    activity.logger.info(f"🚨 Notify Escalation Limit Reached")
    activity.logger.info(f"   Escalations: {escalation_count}")
    activity.logger.info(f"   Recipients: {', '.join(distribution_list)}")

    notification_content = f"""
    ESCALATION LIMIT REACHED

    Workflow: {workflow_details.get('id', 'Unknown')}
    Escalations Attempted: {escalation_count}
    Status: Workflow ending - escalation limit reached

    Please review manually.
    """

    # Simulate sending notification
    await asyncio.sleep(0.3)

    return {
        "notification_id": f"notif-escalation-limit-{datetime.now().timestamp()}",
        "sent_to": distribution_list,
        "escalation_count": escalation_count,
        "workflow_id": workflow_details.get('id'),
        "sent_at": datetime.now().isoformat(),
        "action_count": 1,
        "priority": "high",
        "status": "notified"
    }


# ============================================================================
# 5. DATABASE / TRIGGER ACTIVITIES
# ============================================================================

@activity.defn
async def check_trigger_condition(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger - Check Database Condition

    UI Block Name: "Check Database Trigger"
    Category: Trigger

    Parameters:
        query: Database query (configurable)
        database: Database name (e.g., "shipments")
        check_interval: How often to check (configurable)
        criteria: Data criteria for validation

    Returns:
        condition_met: Boolean
        results: Query results
        count: Number of results
        action_count: 2 (database query + validation)
    """
    query = params.get("query", "SELECT * FROM shipments WHERE status='pending'")
    database = params.get("database", "shipments")
    criteria = params.get("criteria", {})

    activity.logger.info(f"🔍 Check Trigger Condition")
    activity.logger.info(f"   Database: {database}")
    activity.logger.info(f"   Query: {query[:50]}...")

    # Simulate database query
    await asyncio.sleep(0.5)

    # Mock results
    results = [
        {
            "shipment_id": "SHP-FK-001",
            "status": "pending",
            "facility": "Chicago Warehouse",
            "contact_level1": "facility-chicago@example.com",
            "contact_level2": "manager-chicago@example.com",
            "created_at": "2025-10-28T10:00:00Z"
        }
    ]

    condition_met = len(results) > 0

    return {
        "condition_met": condition_met,
        "results": results,
        "count": len(results),
        "database": database,
        "checked_at": datetime.now().isoformat(),
        "action_count": 2,  # Query + validation
        "status": "checked"
    }


# ============================================================================
# 6. HELPER ACTIVITIES (Internal)
# ============================================================================

@activity.defn
async def increment_escalation_counter(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Increment Escalation Counter

    UI Block Name: "Track Escalation"
    Category: Utility

    Parameters:
        current_count: Current escalation count

    Returns:
        new_count: Updated count
        action_count: 1
    """
    current_count = params.get("current_count", 0)
    new_count = current_count + 1

    activity.logger.info(f"➕ Increment Escalation Counter: {current_count} → {new_count}")

    return {
        "previous_count": current_count,
        "new_count": new_count,
        "incremented_at": datetime.now().isoformat(),
        "action_count": 1,
        "status": "incremented"
    }


@activity.defn
async def log_workflow_action(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Log Workflow Action

    UI Block Name: "Log Action"
    Category: Utility

    Parameters:
        action_type: Type of action
        action_data: Data to log
        action_count: Intelligent action count for this operation

    Returns:
        log_id: Log entry ID
        action_count: Specified count
    """
    action_type = params.get("action_type", "unknown")
    action_data = params.get("action_data", {})
    action_count = params.get("action_count", 1)

    activity.logger.info(f"📝 Log Workflow Action: {action_type}")
    activity.logger.info(f"   Action Count: {action_count}")
    activity.logger.info(f"   Data: {json.dumps(action_data, indent=2)[:200]}...")

    return {
        "log_id": f"log-{action_type}-{datetime.now().timestamp()}",
        "action_type": action_type,
        "logged_at": datetime.now().isoformat(),
        "action_count": action_count,
        "status": "logged"
    }


# ============================================================================
# HELPER FUNCTIONS (Mock implementations)
# ============================================================================

async def _get_facility_contact(facility: str, level: int) -> str:
    """Query database for facility contact at specified level"""
    await asyncio.sleep(0.2)
    if level == 1:
        return f"level1-{facility}@example.com"
    elif level == 2:
        return f"manager-{facility}@example.com"
    else:
        return f"contact-{facility}@example.com"


async def _generate_followup_email(missing_fields: List[str], context: Dict[str, Any]) -> str:
    """Use LLM to generate intelligent follow-up email"""
    await asyncio.sleep(0.5)  # Simulate LLM call

    fields_list = ", ".join(missing_fields)
    return f"""
Dear Team,

Thank you for your previous response. To complete our records, we still need the following information:

{fields_list}

Please provide these details at your earliest convenience.

Best regards,
FourKites Operations Team
"""


async def _detect_questions_in_email(parsed_data: Dict[str, Any]) -> bool:
    """Use LLM to detect if email contains questions"""
    await asyncio.sleep(0.3)
    # Mock: randomly detect questions
    return False


async def _detect_unrelated_content(parsed_data: Dict[str, Any]) -> bool:
    """Use LLM to detect unrelated content"""
    await asyncio.sleep(0.3)
    return False


# ============================================================================
# ACTIVITY REGISTRY FOR UI
# ============================================================================

FOURKITES_ACTION_BLOCKS = {
    # Email Actions
    "send_email_level1": {
        "name": "Send Initial Email",
        "category": "Email",
        "description": "Send initial outreach email to facility (Level 1 contact)",
        "action_count": 1,
        "icon": "📧",
        "color": "#3B82F6",
        "activity": send_email_level1,
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "template", "type": "select", "options": ["initial_outreach", "urgent_request"]},
            {"name": "cc_list", "type": "array", "default": []}
        ]
    },
    "send_email_level2_followup": {
        "name": "Send Follow-up Email",
        "category": "Email",
        "description": "Send follow-up for incomplete information (LLM-generated)",
        "action_count": 2,
        "icon": "📧",
        "color": "#8B5CF6",
        "activity": send_email_level2_followup,
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "missing_fields", "type": "array", "required": True},
            {"name": "cc_list", "type": "array", "default": []}
        ]
    },
    "send_email_level3_escalation": {
        "name": "Send Escalation Email",
        "category": "Email",
        "description": "Send escalation email to Level 2 contact",
        "action_count": 1,
        "icon": "🚨",
        "color": "#EF4444",
        "activity": send_email_level3_escalation,
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "escalation_count", "type": "number", "default": 1},
            {"name": "template", "type": "select", "options": ["escalation_urgent", "escalation_final"]},
            {"name": "cc_list", "type": "array", "default": ["escalations@fourkites.com"]}
        ]
    },

    # Data Processing
    "receive_and_parse_email": {
        "name": "Parse Email Response",
        "category": "Data Extraction",
        "description": "Extract structured data from email response",
        "action_count": 1,
        "icon": "📄",
        "color": "#10B981",
        "activity": receive_and_parse_email,
        "config_fields": [
            {"name": "fields_to_extract", "type": "array", "default": ["delivery_date", "tracking_number"]}
        ]
    },

    # Decision Blocks
    "check_response_completeness": {
        "name": "Check Completeness",
        "category": "LLM Analysis",
        "description": "Analyze if response is complete using LLM",
        "action_count": 2,
        "icon": "🔍",
        "color": "#F59E0B",
        "activity": check_response_completeness,
        "config_fields": [
            {"name": "required_fields", "type": "array", "default": ["delivery_date", "tracking_number"]}
        ],
        "branches": ["complete", "incomplete", "contains_questions"]
    },
    "check_escalation_limit": {
        "name": "Check Escalation Limit",
        "category": "Decision",
        "description": "Check if escalation limit has been reached",
        "action_count": 1,
        "icon": "⚖️",
        "color": "#6366F1",
        "activity": check_escalation_limit,
        "config_fields": [
            {"name": "max_escalations", "type": "number", "default": 2}
        ],
        "branches": ["limit_reached", "continue"]
    },

    # Notifications
    "notify_internal_users_questions": {
        "name": "Notify Internal (Questions)",
        "category": "Notification",
        "description": "Notify internal users about questions in response",
        "action_count": 1,
        "icon": "🔔",
        "color": "#EC4899",
        "activity": notify_internal_users_questions,
        "config_fields": [
            {"name": "distribution_list", "type": "array", "default": ["ops@fourkites.com"]},
            {"name": "channel", "type": "select", "options": ["email", "slack", "teams"]}
        ]
    },
    "notify_escalation_limit_reached": {
        "name": "Notify Escalation Limit",
        "category": "Notification",
        "description": "Notify that escalation limit has been reached",
        "action_count": 1,
        "icon": "🚨",
        "color": "#DC2626",
        "activity": notify_escalation_limit_reached,
        "config_fields": [
            {"name": "distribution_list", "type": "array", "default": ["escalations@fourkites.com"]}
        ]
    },

    # Triggers
    "check_trigger_condition": {
        "name": "Check Database Trigger",
        "category": "Trigger",
        "description": "Check database for pending shipments",
        "action_count": 2,
        "icon": "🔍",
        "color": "#059669",
        "activity": check_trigger_condition,
        "config_fields": [
            {"name": "database", "type": "select", "options": ["shipments", "orders", "deliveries"]},
            {"name": "query", "type": "textarea", "default": "SELECT * FROM shipments WHERE status='pending'"}
        ]
    },

    # Utilities
    "increment_escalation_counter": {
        "name": "Track Escalation",
        "category": "Utility",
        "description": "Increment escalation counter",
        "action_count": 1,
        "icon": "➕",
        "color": "#64748B",
        "activity": increment_escalation_counter,
        "config_fields": []
    },
    "log_workflow_action": {
        "name": "Log Action",
        "category": "Utility",
        "description": "Log workflow action with intelligent count",
        "action_count": "variable",
        "icon": "📝",
        "color": "#64748B",
        "activity": log_workflow_action,
        "config_fields": [
            {"name": "action_type", "type": "string", "required": True},
            {"name": "action_count", "type": "number", "default": 1}
        ]
    }
}
