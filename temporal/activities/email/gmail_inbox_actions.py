"""
Gmail Inbox Actions - Real email parsing from Gmail inbox

Uses Gmail API to check inbox and parse email responses
AI-powered extraction using Claude/Azure OpenAI
"""
import asyncio
import os
import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path
import re
import json

from temporalio import activity
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# Gmail IMAP Configuration
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

# AI Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")


def connect_to_gmail():
    """Connect to Gmail IMAP server"""
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        return mail
    except Exception as e:
        raise Exception(f"Failed to connect to Gmail: {str(e)}")


def parse_email_body(msg) -> str:
    """Extract email body from message"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode()
                    break
                except:
                    pass
            elif content_type == "text/html" and not body:
                try:
                    body = part.get_payload(decode=True).decode()
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode()
        except:
            body = str(msg.get_payload())

    return body


async def extract_delivery_info_ai(email_body: str) -> Dict[str, Any]:
    """
    Extract structured delivery information from email body using AI (Claude or Azure OpenAI)

    This replaces regex-based extraction with LLM-powered understanding.
    """

    # Data extraction prompt
    extraction_prompt = """You are an expert email parser for logistics and shipment tracking.
Your task is to extract structured delivery information from the email body provided.

Extract the following fields if present:
1. **delivery_date**: The actual or expected delivery date (format: YYYY-MM-DD or MM/DD/YYYY)
2. **tracking_number**: Shipment tracking number (usually alphanumeric, 10-30 characters)
3. **eta**: Estimated Time of Arrival if different from delivery_date (format: YYYY-MM-DD or MM/DD/YYYY)
4. **status**: Current shipment status (e.g., "delivered", "in transit", "delayed", "pending", "out for delivery")
5. **location**: Current location of the shipment (city, state format)
6. **has_delay**: Boolean - true if there's any mention of delay/late/postponed
7. **delay_reason**: If delayed, what's the reason mentioned?

Additionally, assess the email quality:
- **is_gibberish**: Boolean - Is the response nonsensical, irrelevant, or not related to shipment information?
- **confidence**: Low/Medium/High - Your confidence in the extracted information
- **completeness**: "complete" (all key fields present), "partial" (some fields missing), or "incomplete" (most fields missing)
- **missing_fields**: List the key fields that are missing from required fields: [delivery_date, tracking_number, status]

Return your response as a JSON object with these exact field names. If a field is not found, set it to null (not empty string).

Email body to analyze:
"""

    try:
        # Try Claude (Anthropic) first
        if ANTHROPIC_API_KEY:
            result = await extract_with_claude(email_body, extraction_prompt)
            if result:
                return result

        # Fallback to Azure OpenAI
        if AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT:
            result = await extract_with_azure_openai(email_body, extraction_prompt)
            if result:
                return result

        # If no AI available, fallback to regex
        activity.logger.warning("No AI credentials available, falling back to regex parsing")
        return extract_delivery_info_regex(email_body)

    except Exception as e:
        activity.logger.error(f"AI extraction failed: {str(e)}, falling back to regex")
        return extract_delivery_info_regex(email_body)


async def extract_with_claude(email_body: str, system_prompt: str) -> Dict[str, Any]:
    """Extract using Anthropic Claude API"""
    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

        message = await client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Use latest Claude 3.5 Sonnet
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": email_body[:4000]  # Limit to avoid token issues
                }
            ]
        )

        # Parse JSON response
        response_text = message.content[0].text

        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(response_text)

        # Normalize missing_fields if present
        if "missing_fields" not in parsed:
            required = ["delivery_date", "tracking_number", "status"]
            parsed["missing_fields"] = [f for f in required if not parsed.get(f)]

        # Ensure boolean fields
        parsed["has_delay"] = bool(parsed.get("has_delay", False))
        parsed["is_gibberish"] = bool(parsed.get("is_gibberish", False))

        # Add metadata
        parsed["extraction_method"] = "claude"
        parsed["raw_text"] = email_body[:500]

        activity.logger.info(f"Claude extraction successful - Completeness: {parsed.get('completeness')}")
        return parsed

    except Exception as e:
        activity.logger.error(f"Claude extraction failed: {str(e)}")
        return None


async def extract_with_azure_openai(email_body: str, system_prompt: str) -> Dict[str, Any]:
    """Extract using Azure OpenAI"""
    try:
        from openai import AsyncAzureOpenAI

        client = AsyncAzureOpenAI(
            api_key=AZURE_OPENAI_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )

        response = await client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": email_body[:4000]}
            ],
            response_format={"type": "json_object"},
            max_tokens=1024
        )

        response_text = response.choices[0].message.content
        parsed = json.loads(response_text)

        # Normalize missing_fields if present
        if "missing_fields" not in parsed:
            required = ["delivery_date", "tracking_number", "status"]
            parsed["missing_fields"] = [f for f in required if not parsed.get(f)]

        # Ensure boolean fields
        parsed["has_delay"] = bool(parsed.get("has_delay", False))
        parsed["is_gibberish"] = bool(parsed.get("is_gibberish", False))

        # Add metadata
        parsed["extraction_method"] = "azure_openai"
        parsed["raw_text"] = email_body[:500]

        activity.logger.info(f"Azure OpenAI extraction successful - Completeness: {parsed.get('completeness')}")
        return parsed

    except Exception as e:
        activity.logger.error(f"Azure OpenAI extraction failed: {str(e)}")
        return None


def extract_delivery_info_ai(email_body: str) -> Dict[str, Any]:
    """
    AI-powered extraction using Anthropic Claude to intelligently parse email responses
    Can detect gibberish, incomplete information, and extract structured data
    """
    if not ANTHROPIC_API_KEY:
        # Fallback to regex if no API key
        return extract_delivery_info_regex(email_body)

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=ANTHROPIC_API_KEY)

        prompt = f"""Analyze this email response and extract delivery/shipment information.

Email content:
{email_body}

Your task:
1. Determine if this email contains meaningful delivery/shipment information or if it's gibberish/nonsense
2. Extract the following fields if present:
   - tracking_number: Tracking or reference number
   - delivery_date: Expected delivery date
   - status: Shipment status (e.g., "on schedule", "delivered", "delayed", "in transit")
   - location: Current or destination location
   - eta: Estimated time of arrival
   - delay_reason: Reason for any delays mentioned

3. Determine completeness:
   - "complete": All key fields (tracking_number, delivery_date, status) are present with meaningful values
   - "partial": Some key fields are present but others are missing
   - "incomplete": No meaningful information or gibberish response

Respond ONLY with valid JSON in this exact format:
{{
  "tracking_number": "extracted value or null",
  "delivery_date": "extracted value or null",
  "status": "extracted value or null",
  "location": "extracted value or null",
  "eta": "extracted value or null",
  "delay_reason": "extracted value or null",
  "has_delay": true or false,
  "is_gibberish": true or false,
  "completeness": "complete" or "partial" or "incomplete",
  "missing_fields": ["list", "of", "missing", "required", "fields"],
  "confidence": "High" or "Medium" or "Low",
  "reasoning": "brief explanation of your assessment"
}}"""

        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse Claude's response
        response_text = message.content[0].text

        # Extract JSON from response (Claude might wrap it in markdown)
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            result = json.loads(json_match.group(0))
        else:
            result = json.loads(response_text)

        # Add metadata
        result["extraction_method"] = "ai_anthropic"
        result["raw_text"] = email_body[:500]

        return result

    except Exception as e:
        # Fallback to regex on any error
        print(f"AI extraction failed: {str(e)}, falling back to regex")
        return extract_delivery_info_regex(email_body)


def extract_delivery_info_regex(email_body: str) -> Dict[str, Any]:
    """
    Fallback: Extract structured delivery information using regex patterns
    (Original implementation kept as fallback when AI is unavailable)
    """
    info = {
        "delivery_date": None,
        "tracking_number": None,
        "eta": None,
        "status": None,
        "location": None,
        "has_delay": False,
        "delay_reason": None,
        "is_gibberish": False,  # Regex cannot detect gibberish, always False
        "confidence": "Medium",  # Regex has medium confidence
        "completeness": "incomplete",
        "missing_fields": [],
        "extraction_method": "regex",
        "raw_text": email_body[:500]  # First 500 chars for reference
    }

    # Pattern matching for common fields
    patterns = {
        "delivery_date": r"(?:delivery date|deliver on|delivery|arrival).*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},? \d{4})",
        "tracking_number": r"(?:tracking|track|tracking number|track #).*?([A-Z0-9]{10,30})",
        "eta": r"(?:eta|estimated time|estimated arrival).*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},? \d{4})",
        "status": r"(?:status|shipment status).*?(delivered|in transit|delayed|pending|out for delivery)",
        "location": r"(?:location|current location|at).*?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,?\s*[A-Z]{2})",
    }

    text_lower = email_body.lower()

    for field, pattern in patterns.items():
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            info[field] = match.group(1).strip()

    # Check for delays
    delay_keywords = ["delay", "delayed", "postponed", "late", "behind schedule", "rescheduled"]
    if any(keyword in text_lower for keyword in delay_keywords):
        info["has_delay"] = True
        # Try to extract delay reason
        delay_match = re.search(r"(?:delay|delayed|postponed).*?(?:due to|because of|reason).*?([^.]+)", text_lower)
        if delay_match:
            info["delay_reason"] = delay_match.group(1).strip()

    # Determine completeness
    required_fields = ["delivery_date", "tracking_number", "status"]
    missing = [f for f in required_fields if not info[f]]
    info["missing_fields"] = missing

    if not missing:
        info["completeness"] = "complete"
    elif len(missing) <= 1:
        info["completeness"] = "partial"
    else:
        info["completeness"] = "incomplete"

    return info


@activity.defn
async def check_gmail_inbox(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check Gmail inbox for new emails matching criteria

    UI Block Name: "Check Gmail Inbox"
    Category: Email (Real)
    Action Count: 1

    Parameters:
        subject_filter: Filter emails by subject (optional)
        from_filter: Filter emails by sender (optional)
        since_hours: Check emails from last N hours (default: 24)
        mark_as_read: Mark checked emails as read (default: False)

    Returns:
        action_count: 1
        email_count: Number of emails found
        emails: List of email summaries
    """
    activity.logger.info("📬 Checking Gmail inbox for new emails...")

    subject_filter = params.get("subject_filter", "")
    from_filter = params.get("from_filter", "")
    since_hours = params.get("since_hours", 24)
    mark_as_read = params.get("mark_as_read", False)

    try:
        mail = connect_to_gmail()
        mail.select("INBOX")

        # Build search criteria
        search_criteria = []

        # Date filter
        since_date = (datetime.now() - timedelta(hours=since_hours)).strftime("%d-%b-%Y")
        search_criteria.append(f'(SINCE "{since_date}")')

        # Subject filter
        if subject_filter:
            search_criteria.append(f'SUBJECT "{subject_filter}"')

        # From filter
        if from_filter:
            search_criteria.append(f'FROM "{from_filter}"')

        # Unread only
        search_criteria.append("UNSEEN")

        search_query = " ".join(search_criteria)

        activity.logger.info(f"Search query: {search_query}")

        # Search emails
        _, message_numbers = mail.search(None, search_query)
        email_ids = message_numbers[0].split()

        emails_found = []

        for email_id in email_ids[:10]:  # Limit to 10 most recent
            _, msg_data = mail.fetch(email_id, "(RFC822)")

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])

                    # Decode subject
                    subject = msg["Subject"]
                    if subject:
                        decoded = decode_header(subject)[0]
                        if isinstance(decoded[0], bytes):
                            subject = decoded[0].decode(decoded[1] or "utf-8")

                    # Get sender
                    from_email = msg.get("From", "")

                    # Get date
                    date_str = msg.get("Date", "")

                    # Parse body
                    body = parse_email_body(msg)

                    emails_found.append({
                        "id": email_id.decode(),
                        "subject": subject,
                        "from": from_email,
                        "date": date_str,
                        "body_preview": body[:200] if body else "",
                        "body_full": body
                    })

                    # Mark as read if requested
                    if mark_as_read:
                        mail.store(email_id, '+FLAGS', '\\Seen')

        mail.close()
        mail.logout()

        return {
            "action_count": 1,
            "status": "success",
            "email_count": len(emails_found),
            "emails": emails_found,
            "checked_at": datetime.now().isoformat()
        }

    except Exception as e:
        activity.logger.error(f"Error checking inbox: {str(e)}")
        return {
            "action_count": 1,
            "status": "error",
            "error": str(e),
            "email_count": 0,
            "emails": []
        }


@activity.defn
async def parse_email_response_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse email response and extract delivery information

    UI Block Name: "Parse Email Response (Real)"
    Category: Email (Real)
    Action Count: 2 (includes AI-like parsing)

    Parameters:
        email_body: Email body text to parse
        subject_filter: Optional subject filter
        from_email: Optional sender email for inbox lookup
        auto_fetch: Auto-fetch from inbox if email_body not provided

    Returns:
        action_count: 2
        delivery_date: Extracted delivery date
        tracking_number: Extracted tracking number
        status: Shipment status
        completeness: complete/partial/incomplete
        missing_fields: List of missing required fields
        has_delay: Boolean indicating if there's a delay
    """
    activity.logger.info("📧 Parsing email response for delivery information...")

    email_body = params.get("email_body")

    # Auto-fetch from inbox if no body provided
    if not email_body:
        activity.logger.info("No email body provided, fetching from inbox...")
        inbox_result = await check_gmail_inbox({
            "subject_filter": params.get("subject_filter", ""),
            "from_filter": params.get("from_email", ""),
            "since_hours": params.get("since_hours", 24),
            "mark_as_read": True
        })

        if inbox_result["email_count"] > 0:
            # Use the most recent email
            email_body = inbox_result["emails"][0]["body_full"]
            activity.logger.info(f"Found {inbox_result['email_count']} emails, parsing the first one")
        else:
            return {
                "action_count": 2,
                "status": "no_emails_found",
                "error": "No matching emails found in inbox",
                "completeness": "incomplete"
            }

    # Extract structured information using AI (Anthropic Claude)
    parsed_info = extract_delivery_info_ai(email_body)

    activity.logger.info(f"🤖 AI Extraction Method: {parsed_info.get('extraction_method')}")
    activity.logger.info(f"📊 Completeness: {parsed_info.get('completeness')}")
    activity.logger.info(f"🎯 Confidence: {parsed_info.get('confidence')}")
    activity.logger.info(f"🧠 Reasoning: {parsed_info.get('reasoning')}")

    if parsed_info.get('is_gibberish'):
        activity.logger.warning("⚠️  GIBBERISH DETECTED - This response contains nonsensical content")

    if parsed_info.get('missing_fields'):
        activity.logger.info(f"❌ Missing fields: {', '.join(parsed_info.get('missing_fields'))}")

    # Log extracted data
    if parsed_info.get('tracking_number'):
        activity.logger.info(f"📦 Tracking: {parsed_info.get('tracking_number')}")
    if parsed_info.get('delivery_date'):
        activity.logger.info(f"📅 Delivery Date: {parsed_info.get('delivery_date')}")
    if parsed_info.get('status'):
        activity.logger.info(f"📍 Status: {parsed_info.get('status')}")
    if parsed_info.get('location'):
        activity.logger.info(f"🗺️  Location: {parsed_info.get('location')}")

    return {
        "action_count": 2,
        "status": "success",
        **parsed_info,
        "parsed_at": datetime.now().isoformat()
    }


@activity.defn
async def check_response_timeout_real(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if email response timeout has been exceeded

    UI Block Name: "Check Response Timeout"
    Category: Logic
    Action Count: 1

    Parameters:
        sent_at: ISO timestamp when email was sent
        timeout_hours: Timeout threshold in hours (default: 24)
        last_check_at: Last time we checked (optional)

    Returns:
        action_count: 1
        timeout_exceeded: Boolean
        hours_elapsed: Hours since email was sent
        should_escalate: Boolean indicating if escalation is needed
    """
    activity.logger.info("⏱️ Checking response timeout...")

    sent_at_str = params.get("sent_at")
    timeout_hours = params.get("timeout_hours", 24)

    if not sent_at_str:
        return {
            "action_count": 1,
            "status": "error",
            "error": "sent_at timestamp is required",
            "timeout_exceeded": False
        }

    try:
        sent_at = datetime.fromisoformat(sent_at_str.replace('Z', '+00:00'))
        now = datetime.now()

        # Handle timezone-aware vs naive datetime
        if sent_at.tzinfo is not None:
            from datetime import timezone
            now = now.replace(tzinfo=timezone.utc)

        elapsed = now - sent_at
        hours_elapsed = elapsed.total_seconds() / 3600

        timeout_exceeded = hours_elapsed >= timeout_hours

        # Escalation logic
        should_escalate = False
        escalation_level = "none"

        if hours_elapsed >= timeout_hours * 2:
            should_escalate = True
            escalation_level = "urgent"
        elif hours_elapsed >= timeout_hours * 1.5:
            should_escalate = True
            escalation_level = "high"
        elif timeout_exceeded:
            should_escalate = True
            escalation_level = "normal"

        return {
            "action_count": 1,
            "status": "success",
            "timeout_exceeded": timeout_exceeded,
            "hours_elapsed": round(hours_elapsed, 2),
            "timeout_threshold": timeout_hours,
            "should_escalate": should_escalate,
            "escalation_level": escalation_level,
            "checked_at": datetime.now().isoformat()
        }

    except Exception as e:
        activity.logger.error(f"Error checking timeout: {str(e)}")
        return {
            "action_count": 1,
            "status": "error",
            "error": str(e),
            "timeout_exceeded": False
        }
