"""
FourKites Workflow Builder Backend API

Serves action block metadata and executes workflows in Temporal.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# Temporal imports - commented out for now (these are used in visual builder)
# from temporalio.client import Client
# from temporal.workflows.dynamic_workflow import VisualWorkflowExecutor
# from temporal.activities.fourkites_actions import FOURKITES_ACTION_BLOCKS

app = FastAPI(
    title="FourKites Workflow Builder API",
    description="AI-powered workflow automation with conversational builder and visual flow designer",
    version="1.0.0"
)

# Include API routers - TODO: Add workflow agent router when implemented
# from app.api import workflow_agent_router
# app.include_router(workflow_agent_router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {"status": "healthy", "service": "fourkites-workflow-builder"}

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WorkflowDefinition(BaseModel):
    id: str
    name: str
    config: Dict[str, Any]
    nodes: List[Dict[str, Any]]


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "FourKites Workflow Builder API",
        "version": "1.0.0",
        "endpoints": {
            "actions": "/api/actions",
            "execute": "/api/workflows/execute",
            "status": "/api/workflows/{workflow_id}",
        }
    }


@app.get("/api/actions")
async def get_actions():
    """
    Get all available FourKites action blocks with metadata
    """
    # Group by category
    by_category = {}
    for block_id, block_info in FOURKITES_ACTION_BLOCKS.items():
        category = block_info["category"]
        if category not in by_category:
            by_category[category] = []

        by_category[category].append({
            "id": block_id,
            "name": block_info["name"],
            "description": block_info.get("description", ""),
            "icon": block_info["icon"],
            "color": block_info["color"],
            "action_count": block_info["action_count"],
            "category": category,
            "config_fields": block_info.get("config_fields", [])
        })

    return {
        "total": len(FOURKITES_ACTION_BLOCKS),
        "categories": by_category
    }


@app.post("/api/workflows/execute")
async def execute_workflow(workflow: WorkflowDefinition):
    """
    Execute a workflow definition in Temporal
    """
    try:
        # Validate workflow has at least one trigger node
        trigger_nodes = [n for n in workflow.nodes if n.get("type") == "trigger"]
        if not trigger_nodes:
            raise HTTPException(
                status_code=400,
                detail="Workflow must have at least one trigger node"
            )

        # Connect to Temporal
        client = await Client.connect("localhost:7233")

        # Generate unique workflow ID
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        workflow_id = f"{workflow.id}-{timestamp}"

        # Convert workflow definition to proper format
        workflow_data = workflow.model_dump()

        # If workflow has no edges array but nodes have 'next' field, convert to edges
        if not workflow_data.get("edges") or len(workflow_data.get("edges", [])) == 0:
            edges = []
            for node in workflow_data.get("nodes", []):
                next_nodes = node.get("next", [])
                if next_nodes:
                    for next_node in next_nodes:
                        # Determine edge label based on target node name
                        label = None
                        if "complete" in next_node.lower():
                            label = "complete"
                        elif "partial" in next_node.lower():
                            label = "partial"
                        elif "gibberish" in next_node.lower() or "escalat" in next_node.lower():
                            label = "incomplete/gibberish"

                        edge = {
                            "id": f"e-{node['id']}-{next_node}",
                            "source": node["id"],
                            "target": next_node
                        }
                        if label:
                            edge["label"] = label
                        edges.append(edge)
            workflow_data["edges"] = edges

        # Start workflow
        handle = await client.start_workflow(
            VisualWorkflowExecutor.run,
            workflow_data,
            id=workflow_id,
            task_queue=workflow.config.get("task_queue", "fourkites-workflow-queue"),
        )

        return {
            "status": "started",
            "workflow_id": workflow_id,
            "run_id": handle.first_execution_run_id,
            "task_queue": workflow.config.get("task_queue"),
            "monitor_url": f"http://localhost:8233/namespaces/default/workflows/{workflow_id}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start workflow: {str(e)}"
        )


@app.get("/api/workflows/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """
    Get the status of a running workflow
    """
    try:
        client = await Client.connect("localhost:7233")
        handle = client.get_workflow_handle(workflow_id)

        # Try to get current status
        describe = await handle.describe()

        return {
            "workflow_id": workflow_id,
            "status": describe.status,
            "run_id": describe.run_id,
            "start_time": describe.start_time.isoformat() if describe.start_time else None,
        }

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow not found: {str(e)}"
        )


# ============================================================================
# WORKFLOW CREATION AGENT ENDPOINTS
# ============================================================================

from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import tempfile
import os as os_module

# Import the workflow creation agent
try:
    from src.agents.workflow_creation_agent import (
        create_workflow_builder_agent,
        process_user_message
    )
    AGENT_AVAILABLE = True
except ImportError:
    AGENT_AVAILABLE = False
    print("⚠️ Warning: Workflow creation agent not available")


# Global agent instance and conversation storage
workflow_agent = None
conversation_store = {}


class AgentUploadRequest(BaseModel):
    """Request for uploading a requirement document"""
    session_id: str


class AgentChatRequest(BaseModel):
    """Request for chatting with the agent"""
    session_id: str
    message: str


@app.post("/api/workflow-agent/upload")
async def upload_requirement_document(
    session_id: str,
    file: UploadFile = File(...)
):
    """
    Upload a requirement document (Word/PDF) to start workflow creation process.
    """
    if not AGENT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Workflow creation agent is not available. Please check server logs."
        )

    try:
        # Save uploaded file temporarily
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Initialize agent if not already done
        global workflow_agent
        if workflow_agent is None:
            workflow_agent = create_workflow_builder_agent()

        # Read the document
        from src.agents.workflow_creation_agent import read_requirement_document
        doc_content = read_requirement_document.invoke({"file_path": tmp_path})

        # Clean up temp file
        os_module.unlink(tmp_path)

        # Create initial message for the agent
        initial_message = f"""I have uploaded a requirement document. Here is the content:

{doc_content}

Please analyze this and help me create a workflow."""

        # Initialize conversation for this session
        conversation_store[session_id] = []

        # Process the message
        response = process_user_message(workflow_agent, initial_message, conversation_store[session_id])
        conversation_store[session_id] = response["conversation_history"]

        return {
            "status": "success",
            "session_id": session_id,
            "filename": file.filename,
            "agent_response": response["response"],
            "document_preview": doc_content[:500] + "..." if len(doc_content) > 500 else doc_content
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )


@app.post("/api/workflow-agent/chat")
async def chat_with_agent(request: AgentChatRequest):
    """
    Send a message to the workflow creation agent and get a response.
    Supports conversational workflow building.
    """
    if not AGENT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Workflow creation agent is not available"
        )

    try:
        # Initialize agent if not already done
        global workflow_agent
        if workflow_agent is None:
            workflow_agent = create_workflow_builder_agent()

        # Get or create conversation for this session
        if request.session_id not in conversation_store:
            conversation_store[request.session_id] = []

        # Process the message
        response = process_user_message(
            workflow_agent,
            request.message,
            conversation_store[request.session_id]
        )

        # Update conversation history
        conversation_store[request.session_id] = response["conversation_history"]

        # Extract detected actions from tool calls
        detected_actions = []
        for msg in response["tool_calls"]:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    if tool_call["name"] == "analyze_requirement_and_map_actions":
                        # Parse the tool call result to get suggested actions
                        import json
                        try:
                            # Find the corresponding tool response in conversation history
                            for conv_msg in response["conversation_history"]:
                                if hasattr(conv_msg, "content") and isinstance(conv_msg.content, str):
                                    try:
                                        analysis = json.loads(conv_msg.content)
                                        if "suggested_actions" in analysis:
                                            detected_actions.extend(analysis["suggested_actions"])
                                            break
                                    except:
                                        pass
                        except Exception as e:
                            print(f"Error parsing tool response: {e}")

        return {
            "status": "success",
            "session_id": request.session_id,
            "agent_response": response["response"],
            "tool_calls_made": len(response["tool_calls"]),
            "detected_actions": detected_actions if detected_actions else None
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat message: {str(e)}"
        )


@app.post("/api/workflow-agent/generate")
async def generate_workflow_json(session_id: str):
    """
    Generate the final workflow JSON from the conversation.
    This is called after the user approves the plan.
    """
    if not AGENT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Workflow creation agent is not available"
        )

    try:
        # Get or create conversation for this session
        if session_id not in conversation_store:
            raise HTTPException(
                status_code=404,
                detail="Session not found. Please start a conversation first."
            )

        # Initialize agent if not already done
        global workflow_agent
        if workflow_agent is None:
            workflow_agent = create_workflow_builder_agent()

        # Ask agent to generate final workflow
        generate_message = "Please generate the final workflow JSON now that I've approved the plan."

        response = process_user_message(
            workflow_agent,
            generate_message,
            conversation_store[session_id]
        )

        # Update conversation history
        conversation_store[session_id] = response["conversation_history"]

        # Extract workflow JSON from response
        # The agent should return JSON in the response
        import json
        import re

        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*"nodes"[\s\S]*"edges"[\s\S]*\}', response["response"])
        if json_match:
            workflow_json = json.loads(json_match.group())
        else:
            # Fallback: return a structured response
            workflow_json = {
                "nodes": [],
                "edges": [],
                "metadata": {
                    "source": "workflow_agent",
                    "session_id": session_id
                }
            }

        return {
            "status": "success",
            "session_id": session_id,
            "workflow_json": workflow_json,
            "agent_response": response["response"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate workflow: {str(e)}"
        )


@app.delete("/api/workflow-agent/session/{session_id}")
async def clear_agent_session(session_id: str):
    """
    Clear a conversation session.
    """
    if session_id in conversation_store:
        del conversation_store[session_id]
        return {"status": "success", "message": "Session cleared"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Try to connect to Temporal
        client = await Client.connect("localhost:7233")
        temporal_status = "connected"
    except:
        temporal_status = "disconnected"

    return {
        "status": "healthy",
        "temporal": temporal_status,
        "actions_loaded": len(FOURKITES_ACTION_BLOCKS),
        "agent_available": AGENT_AVAILABLE
    }


if __name__ == "__main__":
    import uvicorn
    print("="*70)
    print("🚀 FourKites Workflow Builder API")
    print("="*70)
    print(f"✅ Loaded {len(FOURKITES_ACTION_BLOCKS)} action blocks")
    print(f"✅ API available at: http://localhost:8000")
    print(f"✅ Documentation: http://localhost:8000/docs")
    print(f"✅ Frontend: http://localhost:3000")
    print("="*70 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8001)
