"""
LangGraph ReAct Agent for Natural Language Workflow Creation

This agent helps users create workflows from requirement documents through conversational interaction.
It can read Word/PDF documents, analyze requirements, ask clarifying questions, and generate visual workflows.
"""

import os
import json
from typing import Dict, Any, List, TypedDict, Annotated
from pathlib import Path
import docx
from PyPDF2 import PdfReader
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool


# ============================================================================
# STATE DEFINITION
# ============================================================================

class WorkflowCreationState(TypedDict):
    """State for the workflow creation agent"""
    requirement_text: str
    available_actions: List[Dict[str, Any]]
    mapped_actions: List[Dict[str, Any]]
    clarifying_questions: List[str]
    user_responses: Dict[str, Any]
    workflow_json: Dict[str, Any]
    conversation_history: List[Dict[str, str]]
    is_complete: bool


# ============================================================================
# ACTION CATALOG - Available Workflow Blocks
# ============================================================================

ACTION_CATALOG = {
    # EMAIL ACTIONS (Real - Production)
    "send_email_level1_real": {
        "name": "Send Initial Email",
        "category": "Email (Real)",
        "description": "Send professional outreach email for shipment information",
        "required_params": ["recipient_email", "facility"],
        "optional_params": ["shipment_id", "cc_list", "email_template", "custom_subject", "custom_message"],
        "param_descriptions": {
            "recipient_email": "Primary recipient email address",
            "facility": "Facility name for the shipment",
            "shipment_id": "Optional shipment tracking ID",
            "cc_list": "Comma-separated CC email addresses",
            "email_template": "Pre-defined email template to use",
            "custom_subject": "Custom email subject line (overrides template)",
            "custom_message": "Custom message content (overrides template)",
        },
        "action_count": 1,
        "icon": "📧",
        "gradient": "from-blue-500 to-cyan-500"
    },
    "send_email_level2_followup_real": {
        "name": "Send Follow-up Email",
        "category": "Email (Real)",
        "description": "Send follow-up email when information is incomplete",
        "required_params": ["recipient_email", "facility", "missing_fields"],
        "optional_params": ["cc_list"],
        "param_descriptions": {
            "recipient_email": "Recipient email address",
            "facility": "Facility name",
            "missing_fields": "List of missing information fields",
            "cc_list": "Comma-separated CC email addresses",
        },
        "action_count": 2,
        "icon": "📨",
        "gradient": "from-blue-600 to-indigo-600"
    },
    "send_email_level3_escalation_real": {
        "name": "Send Escalation Email",
        "category": "Email (Real)",
        "description": "Send urgent escalation email to manager/supervisor",
        "required_params": ["escalation_recipient", "facility", "escalation_level"],
        "optional_params": ["original_recipient", "reason", "cc_list"],
        "param_descriptions": {
            "escalation_recipient": "Manager/supervisor email address",
            "facility": "Facility name",
            "escalation_level": "Escalation level (1-3)",
            "original_recipient": "Original contact email",
            "reason": "Reason for escalation",
            "cc_list": "Comma-separated CC email addresses",
        },
        "action_count": 1,
        "icon": "🚨",
        "gradient": "from-red-500 to-orange-500"
    },
    "check_gmail_inbox": {
        "name": "Check Email Inbox",
        "category": "Email (Real)",
        "description": "Check inbox for new emails and replies",
        "required_params": [],
        "optional_params": ["subject_filter", "from_filter", "since_hours", "mark_as_read"],
        "param_descriptions": {
            "subject_filter": "Filter emails by subject keyword",
            "from_filter": "Filter emails by sender email",
            "since_hours": "Check emails from last N hours (default: 24)",
            "mark_as_read": "Mark checked emails as read (true/false)",
        },
        "action_count": 1,
        "icon": "📬",
        "gradient": "from-indigo-500 to-blue-500"
    },
    "parse_email_response_real": {
        "name": "Parse Email Response (AI)",
        "category": "Email (Real)",
        "description": "AI-powered email parsing to extract delivery info and detect gibberish",
        "required_params": [],
        "optional_params": ["email_body", "subject_filter", "from_email", "auto_fetch", "since_hours"],
        "param_descriptions": {
            "email_body": "Email body to parse (if not using auto_fetch)",
            "subject_filter": "Filter by subject when auto-fetching",
            "from_email": "Filter by sender when auto-fetching",
            "auto_fetch": "Automatically fetch latest email (true/false)",
            "since_hours": "When auto-fetching, look back N hours",
        },
        "action_count": 2,
        "icon": "🤖📧",
        "gradient": "from-purple-500 to-pink-500"
    },

    # LOGIC & CONDITIONALS
    "wait_timer": {
        "name": "Wait Timer",
        "category": "Logic",
        "description": "Wait for specified duration before continuing workflow",
        "required_params": ["duration"],
        "optional_params": ["unit"],
        "param_descriptions": {
            "duration": "How long to wait (number)",
            "unit": "Time unit: seconds, minutes, hours, days (default: minutes)",
        },
        "action_count": 0,
        "icon": "⏱️",
        "gradient": "from-gray-400 to-gray-600"
    },
    "conditional_router": {
        "name": "Conditional Router (If/Else)",
        "category": "If/Else Conditions",
        "description": "Route workflow based on conditions (if/else logic)",
        "required_params": ["condition_field", "operator", "condition_value"],
        "optional_params": ["true_branch", "false_branch"],
        "param_descriptions": {
            "condition_field": "Field to check (e.g., 'email_status', 'response_quality')",
            "operator": "Comparison operator: equals, not_equals, contains, greater_than, less_than",
            "condition_value": "Value to compare against",
            "true_branch": "Node ID to route to if condition is true",
            "false_branch": "Node ID to route to if condition is false",
        },
        "action_count": 0,
        "icon": "🔀",
        "gradient": "from-yellow-500 to-orange-500"
    },

    # DOCUMENT EXTRACTION
    "extract_document_text": {
        "name": "Extract Document Text",
        "category": "Documents",
        "description": "Extract text from PDF or Word documents",
        "required_params": ["document_path"],
        "optional_params": ["page_numbers"],
        "param_descriptions": {
            "document_path": "Path to document file",
            "page_numbers": "Specific pages to extract (optional)",
        },
        "action_count": 1,
        "icon": "📄",
        "gradient": "from-green-500 to-emerald-500"
    },
    "parse_document_with_ai": {
        "name": "Parse Document with AI",
        "category": "Documents",
        "description": "AI-powered document parsing to extract structured information",
        "required_params": ["document_text"],
        "optional_params": ["extraction_fields", "format"],
        "param_descriptions": {
            "document_text": "Text content of document",
            "extraction_fields": "Fields to extract (e.g., date, amount, parties)",
            "format": "Output format: json, text",
        },
        "action_count": 2,
        "icon": "🤖📄",
        "gradient": "from-purple-600 to-blue-600"
    },

    # TRIGGERS
    "check_trigger_condition": {
        "name": "Check Database Trigger",
        "category": "Triggers",
        "description": "Monitor database for new shipments requiring follow-up",
        "required_params": ["database"],
        "optional_params": ["query_filter"],
        "param_descriptions": {
            "database": "Database name to query (e.g., shipments, facilities)",
            "query_filter": "Optional SQL filter for specific records",
        },
        "action_count": 1,
        "icon": "🔍",
        "gradient": "from-purple-500 to-pink-500"
    },
}


# ============================================================================
# TOOLS FOR THE AGENT
# ============================================================================

@tool
def read_requirement_document(file_path: str) -> str:
    """
    Read and extract text from a requirement document (Word or PDF).

    Args:
        file_path: Path to the document file

    Returns:
        Extracted text content from the document
    """
    try:
        path = Path(file_path)

        if not path.exists():
            return f"Error: File not found at {file_path}"

        # Handle Word documents
        if path.suffix.lower() in ['.docx', '.doc']:
            doc = docx.Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text

        # Handle PDF documents
        elif path.suffix.lower() == '.pdf':
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text

        else:
            return f"Error: Unsupported file format {path.suffix}"

    except Exception as e:
        return f"Error reading document: {str(e)}"


@tool
def get_available_actions() -> str:
    """
    Get a list of all available workflow actions/blocks with their descriptions and parameters.

    Returns:
        JSON string containing all available actions
    """
    return json.dumps(ACTION_CATALOG, indent=2)


@tool
def analyze_requirement_and_map_actions(requirement_text: str) -> str:
    """
    Analyze a requirement text and map it to available workflow actions.
    This identifies which actions are needed and in what sequence.

    Args:
        requirement_text: The requirement document text

    Returns:
        JSON string with suggested workflow structure and identified actions
    """
    # This is a simplified version - in production, you'd use LLM analysis here
    analysis = {
        "identified_needs": [],
        "suggested_actions": [],
        "missing_information": [],
        "suggested_sequence": []
    }

    text_lower = requirement_text.lower()

    # Check for email-related requirements
    if "email" in text_lower or "send" in text_lower or "notify" in text_lower:
        analysis["identified_needs"].append("Email communication")

        if "escalat" in text_lower:
            analysis["suggested_actions"].append("send_email_level3_escalation_real")
        elif "follow" in text_lower or "reminder" in text_lower:
            analysis["suggested_actions"].append("send_email_level2_followup_real")
        else:
            analysis["suggested_actions"].append("send_email_level1_real")

    # Check for inbox monitoring
    if "check" in text_lower and ("inbox" in text_lower or "reply" in text_lower or "response" in text_lower):
        analysis["identified_needs"].append("Email monitoring")
        analysis["suggested_actions"].append("check_gmail_inbox")
        analysis["suggested_actions"].append("parse_email_response_real")

    # Check for conditional logic
    if "if" in text_lower or "condition" in text_lower or "when" in text_lower or "else" in text_lower:
        analysis["identified_needs"].append("Conditional logic")
        analysis["suggested_actions"].append("conditional_router")

    # Check for timing/delays
    if "wait" in text_lower or "delay" in text_lower or "hours" in text_lower or "days" in text_lower:
        analysis["identified_needs"].append("Timing/delays")
        analysis["suggested_actions"].append("wait_timer")

    # Check for document processing
    if "document" in text_lower or "pdf" in text_lower or "extract" in text_lower:
        analysis["identified_needs"].append("Document processing")
        analysis["suggested_actions"].append("extract_document_text")
        analysis["suggested_actions"].append("parse_document_with_ai")

    return json.dumps(analysis, indent=2)


@tool
def generate_clarifying_questions(requirement_text: str, mapped_actions: str) -> str:
    """
    Generate conversational clarifying questions for missing parameters.

    Args:
        requirement_text: The requirement document text
        mapped_actions: JSON string of actions that were mapped

    Returns:
        JSON string with clarifying questions
    """
    try:
        actions = json.loads(mapped_actions) if isinstance(mapped_actions, str) else mapped_actions
        questions = []

        # Generate questions based on required parameters
        for action_id in actions.get("suggested_actions", []):
            if action_id in ACTION_CATALOG:
                action = ACTION_CATALOG[action_id]

                # Check for missing required parameters
                for param in action["required_params"]:
                    param_desc = action["param_descriptions"].get(param, param)
                    questions.append({
                        "action": action["name"],
                        "parameter": param,
                        "question": f"For the '{action['name']}' step, what should I use for {param_desc}?",
                        "required": True
                    })

                # Ask about useful optional parameters
                if action_id.startswith("send_email"):
                    if "cc_list" not in requirement_text.lower():
                        questions.append({
                            "action": action["name"],
                            "parameter": "cc_list",
                            "question": f"Would you like to CC anyone on the '{action['name']}'?",
                            "required": False
                        })

        # Ask about negative scenarios
        if "escalat" in requirement_text.lower() or "no response" in requirement_text.lower():
            questions.append({
                "action": "Conditional Logic",
                "parameter": "negative_scenario",
                "question": "What should happen if there's no response? Should we escalate or send a reminder?",
                "required": True
            })

        # Ask about timing
        if any(action in actions.get("suggested_actions", []) for action in ["wait_timer", "check_gmail_inbox"]):
            questions.append({
                "action": "Timing",
                "parameter": "wait_duration",
                "question": "How long should the workflow wait before checking for responses?",
                "required": True
            })

        return json.dumps({"questions": questions}, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e), "questions": []})


@tool
def create_workflow_json(
    requirement_text: str,
    mapped_actions: str,
    user_responses: str
) -> str:
    """
    Generate the final workflow JSON for React Flow canvas.

    Args:
        requirement_text: Original requirements
        mapped_actions: Mapped actions from analysis
        user_responses: User's answers to clarifying questions

    Returns:
        JSON string with nodes and edges for React Flow
    """
    try:
        actions_data = json.loads(mapped_actions) if isinstance(mapped_actions, str) else mapped_actions
        responses_data = json.loads(user_responses) if isinstance(user_responses, str) else user_responses

        nodes = []
        edges = []

        # Create nodes from suggested actions
        x_position = 300
        y_position = 100

        for i, action_id in enumerate(actions_data.get("suggested_actions", [])):
            if action_id in ACTION_CATALOG:
                action = ACTION_CATALOG[action_id]

                node_id = f"node-{i+1}"

                # Extract parameters from user responses
                params = {}
                for response_key, response_value in responses_data.items():
                    if action_id in response_key or action["name"].lower() in response_key.lower():
                        param_name = response_key.split("_")[-1]
                        params[param_name] = response_value

                node = {
                    "id": node_id,
                    "type": "workflowNode",
                    "position": {"x": x_position, "y": y_position},
                    "data": {
                        "label": f"{i+1}. {action['name']}",
                        "activity": action_id,
                        "icon": action["icon"],
                        "gradient": action["gradient"],
                        "params": params,
                        "configured": len(params) > 0,
                        "action_count": action["action_count"]
                    }
                }

                nodes.append(node)

                # Create edge to previous node
                if i > 0:
                    edges.append({
                        "id": f"edge-{i}",
                        "source": f"node-{i}",
                        "target": node_id,
                        "type": "custom"
                    })

                # Update position for next node
                y_position += 150

        workflow = {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "created_from": "natural_language_agent",
                "requirement_summary": requirement_text[:200] + "..." if len(requirement_text) > 200 else requirement_text
            }
        }

        return json.dumps(workflow, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e), "nodes": [], "edges": []})


@tool
def validate_workflow_completeness(workflow_json: str) -> str:
    """
    Validate that the workflow has all required parameters filled in.

    Args:
        workflow_json: The workflow JSON to validate

    Returns:
        Validation result with any missing parameters
    """
    try:
        workflow = json.loads(workflow_json) if isinstance(workflow_json, str) else workflow_json

        validation = {
            "is_valid": True,
            "missing_parameters": [],
            "warnings": []
        }

        for node in workflow.get("nodes", []):
            activity_id = node["data"]["activity"]
            if activity_id in ACTION_CATALOG:
                action = ACTION_CATALOG[activity_id]
                node_params = node["data"].get("params", {})

                # Check required parameters
                for required_param in action["required_params"]:
                    if required_param not in node_params or not node_params[required_param]:
                        validation["is_valid"] = False
                        validation["missing_parameters"].append({
                            "node": node["data"]["label"],
                            "parameter": required_param,
                            "description": action["param_descriptions"].get(required_param, "")
                        })

        # Check for conditional nodes without proper connections
        conditional_nodes = [n for n in workflow.get("nodes", []) if n["data"]["activity"] == "conditional_router"]
        if conditional_nodes:
            if len(workflow.get("edges", [])) < len(workflow.get("nodes", [])):
                validation["warnings"].append("Conditional logic detected but workflow may need additional branches")

        return json.dumps(validation, indent=2)

    except Exception as e:
        return json.dumps({"is_valid": False, "error": str(e)})


@tool
def modify_workflow_steps(current_steps: str, modification_type: str, details: str) -> str:
    """
    Modify workflow steps based on user requests (add, remove, update steps).

    Args:
        current_steps: JSON string of current workflow steps
        modification_type: Type of modification - "add", "remove", "update", or "reorder"
        details: JSON string with modification details

    Returns:
        Updated workflow steps as JSON string
    """
    try:
        steps = json.loads(current_steps) if isinstance(current_steps, str) else current_steps
        mod_details = json.loads(details) if isinstance(details, str) else details

        if modification_type == "add":
            # Add a new step
            action_id = mod_details.get("action_id")
            insert_after = mod_details.get("insert_after", len(steps))  # Default: append to end

            if action_id not in ACTION_CATALOG:
                return json.dumps({"error": f"Action {action_id} not found in catalog"})

            action_def = ACTION_CATALOG[action_id]
            new_step = {
                "stepNumber": insert_after + 1,
                "title": action_def["name"],
                "description": action_def["description"],
                "actionId": action_id,
                "connector": f"FourKites {action_def['category']}",
                "icon": action_def["icon"],
                "status": "pending",
                "params": mod_details.get("params", {})
            }

            # Insert and renumber
            steps.insert(insert_after, new_step)
            for i, step in enumerate(steps):
                step["stepNumber"] = i + 1

        elif modification_type == "remove":
            # Remove a step by number
            step_num = mod_details.get("step_number")
            if step_num and 0 < step_num <= len(steps):
                steps.pop(step_num - 1)
                # Renumber remaining steps
                for i, step in enumerate(steps):
                    step["stepNumber"] = i + 1
            else:
                return json.dumps({"error": f"Invalid step number: {step_num}"})

        elif modification_type == "update":
            # Update parameters of an existing step
            step_num = mod_details.get("step_number")
            if step_num and 0 < step_num <= len(steps):
                steps[step_num - 1]["params"].update(mod_details.get("params", {}))
                steps[step_num - 1]["status"] = "active"
            else:
                return json.dumps({"error": f"Invalid step number: {step_num}"})

        elif modification_type == "reorder":
            # Reorder steps
            from_pos = mod_details.get("from_position")
            to_pos = mod_details.get("to_position")
            if from_pos and to_pos and 0 < from_pos <= len(steps) and 0 < to_pos <= len(steps):
                step = steps.pop(from_pos - 1)
                steps.insert(to_pos - 1, step)
                # Renumber
                for i, step in enumerate(steps):
                    step["stepNumber"] = i + 1
            else:
                return json.dumps({"error": "Invalid positions for reordering"})

        return json.dumps({"success": True, "updated_steps": steps}, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# ============================================================================
# AGENT CREATION
# ============================================================================

def create_workflow_builder_agent():
    """
    Create the LangGraph ReAct agent for workflow creation.

    Returns:
        Configured agent ready to process workflow creation requests
    """

    # Initialize the LLM
    model = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )

    # Define the tools
    tools = [
        read_requirement_document,
        get_available_actions,
        analyze_requirement_and_map_actions,
        generate_clarifying_questions,
        create_workflow_json,
        validate_workflow_completeness,
        modify_workflow_steps,
    ]

    # System message for the agent
    system_message = """You are a helpful workflow creation assistant for FourKites Agentic Workflow Builder.

Your role is to help users create workflows from requirement documents through natural conversation.

**Your Capabilities:**
1. Read and understand requirement documents (Word/PDF)
2. Map requirements to available workflow actions FROM THE ACTION CATALOG ONLY
3. Ask clarifying questions in a conversational, friendly tone
4. Handle negative scenarios and edge cases
5. Generate visual workflow JSON for the canvas

**CRITICAL Guidelines:**
- Be conversational and friendly, like chatting with a colleague
- Ask ONE question at a time for better user experience
- MAINTAIN CONVERSATION CONTEXT - Always remember what you just asked and what the user is responding to
- NEVER repeat greetings or start fresh if you're in the middle of a conversation
- When the user provides an answer, ACKNOWLEDGE it and move to the next question
- ONLY use actions from the ACTION_CATALOG - if a requested action doesn't exist, politely say: "I don't have an action for that yet. I'll add it to our action registry for future updates. Is there anything else I can help with?"
- When you detect an action, use get_available_actions() to check required parameters
- For missing parameters, ask conversationally: "What's the recipient email?" instead of "Please provide recipient_email parameter"
- Always consider negative scenarios (e.g., "What if they don't respond?")
- For conditional branches, ask about threshold values and decision criteria
- Present a plan summary with numbered steps before asking for approval
- After approval, ask for missing parameters one by one

**Example Conversation:**
User: "Send an email when a shipment is delayed"
You: "Got it! I'll set up an email notification for delayed shipments.

Quick question - who should receive the email?"

User: "manager@facility.com"
You: "Perfect! And which facility is this for?"

User: "Chicago warehouse"
You: "Great! Here's the workflow I've created:

1. 📧 Send Initial Email - Notify manager@facility.com about Chicago warehouse delays

Would you like me to add any follow-up steps, like checking for responses?"

**IMPORTANT CONVERSATION RULES:**
- If you just asked "Which facility?" and the user says "Chicago", respond with "Perfect! Chicago it is." - NOT with a greeting or "what would you like to build?"
- Always track what parameter you're currently collecting
- Each message from the user is a response to YOUR previous question - treat it as such
- Build the workflow incrementally as you collect information

Always be helpful and guide the user through the process step by step."""

    # Create the ReAct agent
    # Use messages_modifier instead of state_modifier for newer LangGraph versions
    try:
        agent = create_react_agent(
            model,
            tools,
            messages_modifier=SystemMessage(content=system_message)
        )
    except TypeError:
        # Fallback for older versions that use state_schema
        agent = create_react_agent(
            model,
            tools
        )

    return agent


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def process_user_message(agent, message: str, conversation_history: List = None) -> Dict[str, Any]:
    """
    Process a user message through the agent.

    Args:
        agent: The LangGraph agent
        message: User's message
        conversation_history: Previous conversation messages

    Returns:
        Agent's response and updated conversation history
    """
    if conversation_history is None:
        conversation_history = []

    # Add user message to history
    conversation_history.append(HumanMessage(content=message))

    # Invoke the agent
    result = agent.invoke({"messages": conversation_history})

    # Extract agent's response
    agent_response = result["messages"][-1].content

    # Update conversation history
    conversation_history.append(result["messages"][-1])

    return {
        "response": agent_response,
        "conversation_history": conversation_history,
        "tool_calls": [m for m in result["messages"] if hasattr(m, "tool_calls") and m.tool_calls]
    }


# ============================================================================
# MAIN EXECUTION (for testing)
# ============================================================================

if __name__ == "__main__":
    print("🤖 Workflow Creation Agent")
    print("=" * 50)

    # Create the agent
    agent = create_workflow_builder_agent()

    # Test conversation
    conversation = []

    test_message = """I need a workflow that:
    1. Sends an initial email to a facility
    2. Waits 48 hours
    3. Checks for response
    4. If no response, sends a follow-up email
    5. If still no response after another 48 hours, escalates to manager"""

    print(f"\nUser: {test_message}")

    response = process_user_message(agent, test_message, conversation)
    print(f"\nAgent: {response['response']}")
    print(f"\nTool calls made: {len(response['tool_calls'])}")
