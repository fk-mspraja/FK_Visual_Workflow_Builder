# FourKites Conversational Workflow Builder - Architecture

## Overview

A hybrid system combining **LangGraph** for conversational workflow design and **Temporal** for workflow execution.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │   Chat UI      │  │  Visual Builder  │  │  Workflow List  │ │
│  │  - Upload doc  │  │  - Drag & drop   │  │  - View/Edit    │ │
│  │  - Ask Qs      │  │  - Live preview  │  │  - Deploy       │ │
│  └────────┬───────┘  └────────┬─────────┘  └────────┬────────┘ │
│           └──────────────┬─────┘                     │          │
└──────────────────────────┼───────────────────────────┼──────────┘
                           │                           │
┌──────────────────────────▼───────────────────────────▼──────────┐
│                  WORKFLOW DESIGN LAYER                           │
│                    (LangGraph Agent)                             │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Conversational Agent Workflow                    │ │
│  │                                                            │ │
│  │  1. Document Analysis Node                                │ │
│  │     - Parse requirements doc (PDF/MD/TXT)                 │ │
│  │     - Extract entities (triggers, actions, conditions)    │ │
│  │     - Identify workflow patterns                          │ │
│  │                                                            │ │
│  │  2. Action Grounding Node                                 │ │
│  │     - Query action library/database                       │ │
│  │     - Match requirements to existing actions              │ │
│  │     - Identify missing actions                            │ │
│  │     - Suggest alternatives                                │ │
│  │                                                            │ │
│  │  3. Clarification Node                                    │ │
│  │     - Generate intelligent questions                      │ │
│  │     - Handle user responses                               │ │
│  │     - Maintain conversation context                       │ │
│  │                                                            │ │
│  │  4. Workflow Generation Node                              │ │
│  │     - Create workflow JSON/YAML                           │ │
│  │     - Generate visual representation                      │ │
│  │     - Validate workflow logic                             │ │
│  │                                                            │ │
│  │  5. Refinement Node                                       │ │
│  │     - Handle edit requests ("Add CC field")               │ │
│  │     - Update workflow definition                          │ │
│  │     - Show diff/changes                                   │ │
│  │                                                            │ │
│  │  6. Code Generation Node                                  │ │
│  │     - Generate Temporal workflow code                     │ │
│  │     - Generate activity configurations                    │ │
│  │     - Create deployment manifest                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Tools Available to Agent:                                       │
│  - query_action_library()                                        │
│  - validate_workflow_schema()                                    │
│  - generate_workflow_json()                                      │
│  - render_visual_diagram()                                       │
│  - search_similar_workflows()                                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Generates workflow definition
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   WORKFLOW STORAGE LAYER                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Workflow Defs   │  │ Action Library   │  │ Conversations  │ │
│  │ (JSON/YAML)     │  │ (Metadata DB)    │  │ (Chat History) │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                 WORKFLOW EXECUTION LAYER                         │
│                   (Temporal Engine)                              │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Dynamic Workflow Executor                         │ │
│  │                                                            │ │
│  │  - Interprets workflow JSON/YAML                          │ │
│  │  - Executes activities from library                       │ │
│  │  - Manages state & persistence                            │ │
│  │  - Handles timers & signals                               │ │
│  │  - Provides observability                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               Activity Library                             │ │
│  │                                                            │ │
│  │  ├── Email Activities                                     │ │
│  │  │   ├── send_email_smtp                                  │ │
│  │  │   ├── send_email_ses                                   │ │
│  │  │   ├── parse_email                                      │ │
│  │  │   └── receive_email_signal                             │ │
│  │  │                                                         │ │
│  │  ├── Data Activities                                      │ │
│  │  │   ├── query_database                                   │ │
│  │  │   ├── data_extraction                                  │ │
│  │  │   └── data_validation                                  │ │
│  │  │                                                         │ │
│  │  ├── LLM Activities                                       │ │
│  │  │   ├── analyze_completeness                             │ │
│  │  │   ├── generate_follow_up                               │ │
│  │  │   └── classify_content                                 │ │
│  │  │                                                         │ │
│  │  ├── Notification Activities                              │ │
│  │  │   ├── send_slack_notification                          │ │
│  │  │   ├── send_teams_notification                          │ │
│  │  │   └── create_jira_ticket                               │ │
│  │  │                                                         │ │
│  │  └── Utility Activities                                   │ │
│  │      ├── wait_with_timeout                                │ │
│  │      ├── increment_counter                                │ │
│  │      └── log_action                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. LangGraph Agent (Workflow Designer)

**Purpose**: Conversational interface for creating workflows

**Graph Structure**:
```python
# Pseudo-code for LangGraph workflow
class WorkflowDesignerAgent:
    nodes = [
        "analyze_document",
        "ground_to_actions",
        "ask_clarifications",
        "generate_workflow",
        "refine_workflow",
        "finalize"
    ]

    edges = {
        "analyze_document": ["ground_to_actions"],
        "ground_to_actions": ["ask_clarifications", "generate_workflow"],
        "ask_clarifications": ["ground_to_actions", "generate_workflow"],
        "generate_workflow": ["refine_workflow", "finalize"],
        "refine_workflow": ["generate_workflow", "finalize"],
    }
```

**State Management**:
```python
class WorkflowDesignerState(TypedDict):
    user_input: str
    requirements_doc: str
    parsed_requirements: Dict
    available_actions: List[Action]
    matched_actions: List[Action]
    missing_actions: List[str]
    clarifications_needed: List[Question]
    conversation_history: List[Message]
    workflow_definition: WorkflowDef
    visual_representation: str
    validation_errors: List[str]
```

### 2. Temporal Dynamic Workflow Executor

**Purpose**: Execute workflows defined in JSON/YAML

**Key Pattern**: Interpreter pattern for workflow execution

```python
@workflow.defn
class DynamicWorkflowExecutor:
    """Executes workflows from JSON definitions"""

    @workflow.run
    async def run(self, workflow_def: WorkflowDefinition):
        # Interpret workflow definition
        state = WorkflowState()

        for node in workflow_def.nodes:
            if node.type == "trigger":
                result = await self._execute_trigger(node, state)
            elif node.type == "action":
                result = await self._execute_action(node, state)
            elif node.type == "condition":
                result = await self._execute_condition(node, state)
                # Branch based on result
                next_node = node.true_path if result else node.false_path
            elif node.type == "wait":
                result = await self._execute_wait(node, state)

            state.update(node.id, result)

    async def _execute_action(self, node: ActionNode, state: WorkflowState):
        """Execute activity from library"""
        activity_name = node.activity
        params = self._resolve_params(node.params, state)

        return await workflow.execute_activity(
            activity_name,
            params,
            schedule_to_close_timeout=timedelta(seconds=node.timeout),
            retry_policy=node.retry_policy
        )
```

## Workflow Definition Schema

### JSON Schema for Workflow Definition

```json
{
  "workflow": {
    "id": "email-escalation-v1",
    "name": "Email Escalation Workflow",
    "version": "1.0.0",
    "description": "Auto-generated from requirements doc",
    "metadata": {
      "created_by": "agent",
      "created_at": "2025-10-28T10:00:00Z",
      "conversation_id": "conv-123"
    },
    "config": {
      "task_queue": "email-escalation-queue",
      "execution_timeout": "72h",
      "max_retries": 3
    },
    "nodes": [
      {
        "id": "trigger_1",
        "type": "trigger",
        "name": "Check Database Condition",
        "activity": "query_database",
        "params": {
          "query": "SELECT * FROM shipments WHERE status='pending'",
          "interval": "1h"
        },
        "next": ["send_email_1"]
      },
      {
        "id": "send_email_1",
        "type": "action",
        "name": "Send Initial Email",
        "activity": "send_email_ses",
        "params": {
          "template": "initial_outreach",
          "recipient_query": {
            "level": 1,
            "facility": "{{trigger_1.result.facility}}"
          },
          "cc": ["ops@fourkites.com"]
        },
        "timeout": 300,
        "retry_policy": {
          "max_attempts": 3,
          "backoff": "exponential"
        },
        "next": ["wait_for_response_1"]
      },
      {
        "id": "wait_for_response_1",
        "type": "wait",
        "name": "Wait for Email Response",
        "signal_name": "email_received",
        "timeout": "24h",
        "on_timeout": ["escalate_1"],
        "on_signal": ["parse_email_1"]
      },
      {
        "id": "parse_email_1",
        "type": "action",
        "name": "Parse Email Response",
        "activity": "parse_email",
        "params": {
          "content": "{{wait_for_response_1.signal_data}}",
          "fields": ["delivery_date", "tracking_number", "eta"]
        },
        "next": ["check_completeness_1"]
      },
      {
        "id": "check_completeness_1",
        "type": "condition",
        "name": "Check Response Completeness",
        "activity": "analyze_completeness",
        "params": {
          "parsed_data": "{{parse_email_1.result}}",
          "required_fields": ["delivery_date", "tracking_number"]
        },
        "branches": {
          "complete": ["end_success"],
          "incomplete": ["send_email_2"],
          "contains_questions": ["notify_internal_1"]
        }
      },
      {
        "id": "send_email_2",
        "type": "action",
        "name": "Send Follow-up Email",
        "activity": "generate_and_send_followup",
        "params": {
          "context": "{{check_completeness_1.result}}",
          "missing_fields": "{{check_completeness_1.result.missing}}",
          "previous_email": "{{parse_email_1.result}}"
        },
        "next": ["wait_for_response_2"]
      },
      {
        "id": "escalate_1",
        "type": "action",
        "name": "Send Escalation Email",
        "activity": "send_email_ses",
        "params": {
          "template": "escalation",
          "recipient_query": {
            "level": 2,
            "facility": "{{trigger_1.result.facility}}"
          },
          "cc": ["escalations@fourkites.com"],
          "priority": "high"
        },
        "next": ["increment_escalation"]
      },
      {
        "id": "increment_escalation",
        "type": "action",
        "name": "Track Escalation",
        "activity": "increment_counter",
        "params": {
          "counter": "escalation_count"
        },
        "next": ["check_escalation_limit"]
      },
      {
        "id": "check_escalation_limit",
        "type": "condition",
        "name": "Check Escalation Limit",
        "expression": "{{increment_escalation.result.count}} >= 2",
        "branches": {
          "true": ["notify_escalation_limit"],
          "false": ["wait_for_response_2"]
        }
      },
      {
        "id": "notify_escalation_limit",
        "type": "action",
        "name": "Notify Internal Team",
        "activity": "send_slack_notification",
        "params": {
          "channel": "#escalations",
          "message": "Escalation limit reached for workflow {{workflow.id}}"
        },
        "next": ["end_escalation_limit"]
      },
      {
        "id": "end_success",
        "type": "end",
        "name": "Workflow Complete - Success",
        "status": "success"
      },
      {
        "id": "end_escalation_limit",
        "type": "end",
        "name": "Workflow Complete - Escalation Limit",
        "status": "escalation_limit_reached"
      }
    ]
  }
}
```

## Action Library Metadata Schema

```json
{
  "actions": [
    {
      "id": "send_email_ses",
      "name": "Send Email via AWS SES",
      "category": "email",
      "description": "Send email using Amazon SES",
      "tags": ["email", "notification", "aws"],
      "input_schema": {
        "template": {"type": "string", "required": true},
        "recipient": {"type": "string", "required": true},
        "cc": {"type": "array", "items": "string"},
        "attachments": {"type": "array", "items": "file"}
      },
      "output_schema": {
        "message_id": "string",
        "sent_at": "timestamp",
        "status": "string"
      },
      "cost": {
        "credits": 1,
        "execution_time_avg": "2s"
      },
      "examples": [
        {
          "description": "Send welcome email",
          "input": {
            "template": "welcome",
            "recipient": "user@example.com"
          }
        }
      ]
    },
    {
      "id": "parse_email",
      "name": "Parse Email Content",
      "category": "data_extraction",
      "description": "Extract structured data from email",
      "tags": ["email", "parsing", "nlp"],
      "input_schema": {
        "content": {"type": "string", "required": true},
        "fields": {"type": "array", "items": "string", "required": true}
      },
      "output_schema": {
        "extracted_data": "object",
        "confidence_scores": "object"
      }
    },
    {
      "id": "analyze_completeness",
      "name": "Analyze Response Completeness",
      "category": "llm",
      "description": "Use LLM to check if response is complete",
      "tags": ["llm", "analysis", "ai"],
      "input_schema": {
        "parsed_data": {"type": "object", "required": true},
        "required_fields": {"type": "array", "items": "string"}
      },
      "output_schema": {
        "is_complete": "boolean",
        "missing_fields": "array",
        "contains_questions": "boolean",
        "questions_extracted": "array"
      },
      "cost": {
        "credits": 2,
        "uses_llm": true
      }
    }
  ]
}
```

## Conversation Flow Example

```
User: [Uploads requirements doc]

Agent: I've analyzed your requirements. I found:
       - 3 email actions needed
       - 1 trigger condition
       - 2 escalation paths
       - Timer-based logic

       I can use these existing actions:
       ✅ send_email_ses (for all email sends)
       ✅ parse_email (for email parsing)
       ✅ query_database (for trigger)

       I need clarification:
       1. Which database should the trigger query?
       2. Should escalation emails go to managers or ops team?

User: Use shipments database. Send to managers.

Agent: Perfect! Here's the workflow I've created:
       [Shows visual diagram in UI]

       Should I add any conditions or modify anything?

User: Add CC to ops@fourkites.com on all emails

Agent: ✅ Updated! Added CC field to all 3 email actions.
       [Shows updated diagram with diff highlighting]

       Ready to deploy? This workflow will:
       - Check database every 1 hour
       - Send initial email
       - Wait 24h for response
       - Escalate if no response (max 2 times)
       - Use LLM to check completeness

User: Deploy it

Agent: ✅ Workflow deployed!
       - Workflow ID: email-escalation-v1
       - Task Queue: email-escalation-queue
       - Status: Active

       You can monitor it at: http://temporal:8233/workflows/email-escalation-v1
```

## Technology Stack

### LangGraph Layer
- **Framework**: LangGraph
- **LLM**: Claude/GPT-4 for reasoning
- **Vector DB**: ChromaDB/Pinecone for action library search
- **Memory**: LangGraph checkpoints for conversation state

### Temporal Layer
- **Workflow Engine**: Temporal
- **Workers**: Python Temporal SDK
- **Storage**: PostgreSQL (Temporal persistence)
- **Activities**: Modular Python activities

### Storage
- **Workflow Definitions**: MongoDB/PostgreSQL (JSON storage)
- **Action Library**: PostgreSQL with full-text search
- **Conversation History**: Redis + Long-term PostgreSQL

### UI
- **Framework**: React + TypeScript
- **Workflow Visualization**: React Flow / Xyflow
- **Chat Interface**: Custom React components
- **Real-time**: WebSockets for live updates

## Key Implementation Considerations

### 1. Action Grounding
```python
async def ground_requirements_to_actions(requirements: str, action_library: List[Action]):
    """Use LLM + vector search to match requirements to actions"""

    # Embed requirements
    req_embedding = await embed(requirements)

    # Vector search for similar actions
    similar_actions = await vector_db.search(req_embedding, k=10)

    # LLM to verify and match
    prompt = f"""
    Requirements: {requirements}

    Available actions: {similar_actions}

    Match each requirement to the best action. Explain your reasoning.
    """

    matches = await llm.invoke(prompt)
    return matches
```

### 2. Workflow Validation
```python
def validate_workflow_definition(workflow_def: WorkflowDef) -> ValidationResult:
    """Validate workflow before deployment"""
    errors = []

    # Check for cycles (except intentional loops)
    if has_invalid_cycles(workflow_def):
        errors.append("Invalid cycle detected")

    # Check all activities exist
    for node in workflow_def.nodes:
        if node.type == "action":
            if not action_exists(node.activity):
                errors.append(f"Action {node.activity} not found")

    # Check variable references
    for node in workflow_def.nodes:
        for param_value in node.params.values():
            if is_reference(param_value):
                if not reference_is_valid(param_value, workflow_def):
                    errors.append(f"Invalid reference: {param_value}")

    return ValidationResult(valid=len(errors) == 0, errors=errors)
```

### 3. Dynamic Activity Dispatch
```python
# Activity registry
ACTIVITY_REGISTRY = {
    "send_email_ses": send_email_ses_activity,
    "parse_email": parse_email_activity,
    "analyze_completeness": analyze_completeness_activity,
    # ... all activities
}

async def execute_dynamic_activity(
    activity_name: str,
    params: Dict[str, Any],
    config: ActivityConfig
):
    """Dynamically execute activity from registry"""
    if activity_name not in ACTIVITY_REGISTRY:
        raise ValueError(f"Activity {activity_name} not found")

    activity_fn = ACTIVITY_REGISTRY[activity_name]

    return await workflow.execute_activity(
        activity_fn,
        params,
        schedule_to_close_timeout=timedelta(seconds=config.timeout),
        retry_policy=config.retry_policy
    )
```

## Deployment Strategy

1. **Development**: User creates workflow via chat
2. **Validation**: Agent validates workflow definition
3. **Preview**: Show visual diagram + simulation
4. **Deployment**:
   - Save workflow definition to DB
   - Generate Temporal workflow code (or use dynamic executor)
   - Deploy to Temporal cluster
   - Start workflow instances based on trigger

## Monitoring & Observability

- **Temporal Web UI**: For workflow execution monitoring
- **Custom Dashboard**: For workflow performance metrics
- **Chat History**: Track workflow creation conversations
- **Action Analytics**: Track which actions are used most

## Future Enhancements

1. **Workflow Templates**: "I want workflow similar to email-escalation"
2. **A/B Testing**: "Run 50% with template A, 50% with template B"
3. **Auto-optimization**: Agent suggests improvements based on metrics
4. **Natural Language Queries**: "Show me all failed workflows from last week"
5. **Workflow Versioning**: Track changes, rollback capabilities

