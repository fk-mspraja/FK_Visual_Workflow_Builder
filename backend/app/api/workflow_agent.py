"""
Workflow Agent API Routes
Handles conversational workflow building with AI using LangGraph ReAct Agent
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json

from app.agents.workflow_agent import create_workflow_builder_agent, process_user_message
from app.core.session_store import InMemorySessionStore

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize agent and session store
agent = None
session_store = InMemorySessionStore()


def get_agent():
    """Lazily initialize the agent"""
    global agent
    if agent is None:
        logger.info("Initializing LangGraph workflow builder agent...")
        agent = create_workflow_builder_agent()
    return agent


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
    Chat endpoint for conversational workflow building with LangGraph ReAct agent

    This endpoint uses a real AI agent that:
    - Analyzes user requirements
    - Maps them to available actions
    - Asks clarifying questions
    - Collects missing parameters
    - Generates workflow JSON when complete
    """
    try:
        session_id = request.session_id or f"session-{id(request)}"
        logger.info(f"[{session_id}] Processing message: {request.message[:100]}...")

        # Get conversation history for this session
        conversation_history = session_store.get_conversation(session_id)

        # Get the agent
        workflow_agent = get_agent()

        # Process message with LangGraph agent
        result = process_user_message(
            agent=workflow_agent,
            message=request.message,
            conversation_history=conversation_history
        )

        # Extract response
        agent_response = result.get("response", "I'm processing your request...")

        # Parse detected actions from agent's tool calls
        detected_actions = []
        workflow_steps = None

        # Check if agent mapped actions
        if "suggested_actions" in result:
            for action_id in result.get("suggested_actions", []):
                # Import ACTION_CATALOG from workflow_agent
                from app.agents.workflow_agent import ACTION_CATALOG
                if action_id in ACTION_CATALOG:
                    action_def = ACTION_CATALOG[action_id]
                    detected_actions.append({
                        "action_id": action_id,
                        "name": action_def["name"],
                        "icon": action_def["icon"],
                        "confidence": 0.9
                    })

        # Check if workflow is complete
        if result.get("workflow_json"):
            try:
                workflow_data = json.loads(result["workflow_json"]) if isinstance(result["workflow_json"], str) else result["workflow_json"]
                # Convert nodes to workflow_steps format for frontend
                workflow_steps = []
                for i, node in enumerate(workflow_data.get("nodes", [])):
                    workflow_steps.append({
                        "stepNumber": i + 1,
                        "actionId": node["data"]["activity"],
                        "title": node["data"]["label"],
                        "description": node["data"].get("label", ""),
                        "icon": node["data"].get("icon", "📦"),
                        "connector": "FourKites",
                        "status": "pending",
                        "params": node["data"].get("params", {})
                    })
            except Exception as e:
                logger.error(f"Error parsing workflow JSON: {e}")

        # Update conversation history
        updated_history = result.get("conversation_history", conversation_history)
        session_store.save_conversation(session_id, updated_history)

        return ChatResponse(
            status="success",
            session_id=session_id,
            agent_response=agent_response,
            detected_actions=detected_actions if detected_actions else None,
            workflow_steps=workflow_steps
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
