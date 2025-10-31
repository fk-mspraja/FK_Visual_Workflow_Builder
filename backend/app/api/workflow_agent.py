"""
Workflow Agent API Routes
Handles conversational workflow building with AI using Anthropic Claude
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import os

from anthropic import Anthropic
from app.core.session_store import InMemorySessionStore

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Anthropic client and session store
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
session_store = InMemorySessionStore()

# Action catalog for workflow building
ACTION_CATALOG = {
    "send_email_level1_real": {"name": "Send Initial Email", "icon": "📧"},
    "send_email_level2_followup_real": {"name": "Send Follow-up Email", "icon": "📨"},
    "send_email_level3_escalation_real": {"name": "Send Escalation Email", "icon": "🚨"},
    "check_gmail_inbox": {"name": "Check Email Inbox", "icon": "📬"},
    "parse_email_response_real": {"name": "Parse Email Response (AI)", "icon": "🤖📧"},
    "wait_timer": {"name": "Wait Timer", "icon": "⏱️"},
    "conditional_router": {"name": "Conditional Router (If/Else)", "icon": "🔀"},
    "extract_document_text": {"name": "Extract Document Text", "icon": "📄"},
    "parse_document_with_ai": {"name": "Parse Document with AI", "icon": "🤖📄"},
    "check_trigger_condition": {"name": "Check Database Trigger", "icon": "🔔"},
}

SYSTEM_PROMPT = """You are a helpful workflow creation assistant for FourKites supply chain operations.

Your job is to help users create workflows by:
1. Understanding their requirements in natural language
2. Asking ONE clarifying question at a time (be conversational!)
3. Mapping their needs to available actions
4. Collecting required parameters through friendly conversation
5. Building a complete workflow when you have all information

Available actions:
- send_email_level1_real: Send initial email (needs: recipient_email, facility)
- send_email_level2_followup_real: Send follow-up email
- send_email_level3_escalation_real: Send escalation email
- check_gmail_inbox: Check inbox for responses
- parse_email_response_real: Parse email with AI
- wait_timer: Wait for specified duration (needs: duration)
- conditional_router: If/else logic
- extract_document_text: Extract text from PDFs
- parse_document_with_ai: Parse documents with AI

Guidelines:
- Ask ONE question at a time
- Be friendly and conversational
- Say "I don't have that action yet" if they request something unavailable
- When you have enough info, suggest the workflow clearly
"""


class ChatRequest(BaseModel):
    """Chat request from frontend"""
    message: str
    session_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, Any]]] = None


class ChatResponse(BaseModel):
    """Chat response to frontend"""
    status: str
    session_id: str
    agent_response: str
    detected_actions: Optional[List[Dict[str, Any]]] = None
    workflow_steps: Optional[List[Dict[str, Any]]] = None


@router.post("/workflow-agent/chat")
async def chat_with_agent(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint for conversational workflow building with Anthropic Claude

    Uses Claude to:
    - Analyze user requirements conversationally
    - Ask clarifying questions ONE at a time
    - Map needs to available actions
    - Collect required parameters
    - Build workflow steps when complete
    """
    try:
        session_id = request.session_id or f"session-{id(request)}"
        logger.info(f"[{session_id}] Processing message: {request.message[:100]}...")

        # Get conversation history
        conversation_history = session_store.get_conversation(session_id)

        # Build messages for Claude
        messages = []
        for msg in conversation_history:
            messages.append(msg)

        # Add current user message
        messages.append({"role": "user", "content": request.message})

        # Call Claude API
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages
        )

        agent_response = response.content[0].text

        # Detect actions mentioned in user's message
        detected_actions = []
        user_lower = request.message.lower()

        action_keywords = {
            "send_email_level1_real": ["send email", "email", "notify", "notification"],
            "wait_timer": ["wait", "delay", "timer", "hours", "days"],
            "send_email_level3_escalation_real": ["escalate", "escalation", "urgent"],
            "parse_email_response_real": ["parse", "extract", "analyze email"],
            "check_gmail_inbox": ["check inbox", "check email", "monitor"],
        }

        for action_id, keywords in action_keywords.items():
            if any(kw in user_lower for kw in keywords):
                if action_id in ACTION_CATALOG:
                    detected_actions.append({
                        "action_id": action_id,
                        "name": ACTION_CATALOG[action_id]["name"],
                        "icon": ACTION_CATALOG[action_id]["icon"],
                        "confidence": 0.9
                    })

        # Update conversation history
        messages.append({"role": "assistant", "content": agent_response})
        session_store.save_conversation(session_id, messages)

        return ChatResponse(
            status="success",
            session_id=session_id,
            agent_response=agent_response,
            detected_actions=detected_actions if detected_actions else None,
            workflow_steps=None
        )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflow-agent/upload")
async def upload_document(session_id: Optional[str] = None):
    """
    Handle document upload for workflow requirements

    TODO: Implement actual document processing
    """
    return {
        "status": "success",
        "session_id": session_id or "new-session",
        "agent_response": "📄 Document uploaded successfully! I'll analyze it and suggest a workflow based on the requirements."
    }
