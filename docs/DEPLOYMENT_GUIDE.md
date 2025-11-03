# FourKites Agentic Workflow Builder - Complete Guide

## Table of Contents
1. [How Workflows Deploy to Temporal](#1-how-workflows-deploy-to-temporal)
2. [How to Know You Selected Right Actions](#2-action-selection-validation)
3. [How to Add Conditional Blocks](#3-adding-conditional-blocks)
4. [How to Edit Each Node](#4-editing-node-parameters)
5. [Natural Language Workflow Creation](#5-natural-language-workflow-creation)

---

## 1. How Workflows Deploy to Temporal

### System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐      ┌──────────────┐
│   Frontend  │─────▶│  API Server  │─────▶│ Temporal       │─────▶│   Worker     │
│             │      │              │      │ Orchestrator   │      │              │
│ React Flow  │      │ FastAPI      │      │                │      │ Activities   │
│ Port 3003   │      │ Port 8001    │      │ Port 7233      │      │ Background   │
└─────────────┘      └──────────────┘      └────────────────┘      └──────────────┘
```

### Deployment Steps

#### **Step 1: Build Workflow on Canvas**

1. **Drag Actions from Sidebar**
   - Email actions (Send Initial Email, Follow-up, Escalation)
   - Logic blocks (Wait Timer, Conditional Router)
   - Document extraction blocks
   - Inbox monitoring

2. **Connect Nodes**
   - Drag from output handle (right side) to input handle (left side)
   - Creates edges that define execution flow
   - For conditionals, label edges (e.g., "complete", "partial", "incomplete")

3. **Configure Parameters**
   - Click any node to open ConfigPanel (right sidebar)
   - Fill in required parameters (marked with red *)
   - Optional parameters enhance functionality

#### **Step 2: Execute Workflow**

Click the **"Execute Workflow"** button in the top toolbar.

**What Happens Behind the Scenes:**

```typescript
// Frontend sends to API
POST /api/workflows/execute
{
  "id": "my-workflow",
  "name": "Email Escalation Flow",
  "nodes": [...],  // All your canvas nodes
  "edges": [...],  // Connections between nodes
  "config": {
    "task_queue": "fourkites-workflow-queue"
  }
}
```

#### **Step 3: API Starts Temporal Workflow**

File: `examples/visual_workflow_builder/backend/api.py:135`

```python
# Connect to Temporal
client = await Client.connect("localhost:7233")

# Start the dynamic workflow executor
handle = await client.start_workflow(
    VisualWorkflowExecutor.run,  # The workflow class
    workflow_data,               # Your nodes & edges
    id=workflow_id,              # Unique ID
    task_queue="fourkites-workflow-queue",
)
```

**Response:**
```json
{
  "status": "started",
  "workflow_id": "my-workflow-20231031123456",
  "run_id": "abc123...",
  "monitor_url": "http://localhost:8233/namespaces/default/workflows/..."
}
```

#### **Step 4: Worker Processes Workflow**

The **fourkites_real_worker.py** picks up the workflow:

File: `workers/fourkites_real_worker.py`

```python
# Worker registered all activities
worker = Worker(
    client,
    task_queue="fourkites-workflow-queue",
    workflows=[VisualWorkflowExecutor],  # The workflow executor
    activities=[
        send_email_level1_real,
        send_email_level2_followup_real,
        check_gmail_inbox,
        parse_email_response_real,
        # ... 20+ more activities
    ],
)
```

#### **Step 5: Dynamic Execution**

File: `examples/visual_workflow_builder/backend/dynamic_workflow.py:48`

The `VisualWorkflowExecutor` workflow:

1. **Reads your workflow definition** (nodes & edges)
2. **Finds starting nodes** (nodes with no incoming edges)
3. **Executes each node as an activity**:
   ```python
   result = await workflow.execute_activity(
       activity_name,  # e.g., "send_email_level1_real"
       params,         # e.g., {"recipient_email": "...", "facility": "..."}
       start_to_close_timeout=timedelta(seconds=120),
   )
   ```
4. **Stores results in WorkflowState**:
   ```python
   self.state.set_node_result(node_id, result)
   ```
5. **Determines next node** based on edges and conditional logic
6. **Repeats until no more nodes to execute**

#### **Step 6: Monitor Execution**

Two ways to monitor:

1. **Temporal Web UI**: http://localhost:8233
   - Shows workflow execution timeline
   - Activity results
   - Retry history
   - Current state

2. **API Status Endpoint**:
   ```bash
   GET /api/workflows/{workflow_id}
   ```

---

## 2. Action Selection Validation

### How to Know You Selected the Right Actions

The **Natural Language Workflow Builder Agent** we built helps with this!

#### **Method 1: Use the AI Agent (Recommended)**

1. **Upload your requirement document** (Word/PDF)
2. **Agent analyzes requirements** using `analyze_requirement_and_map_actions` tool
3. **Agent suggests actions** based on keywords and patterns:

```python
# From workflow_creation_agent.py:309
if "email" in text_lower:
    if "escalat" in text_lower:
        analysis["suggested_actions"].append("send_email_level3_escalation_real")
    elif "follow" in text_lower:
        analysis["suggested_actions"].append("send_email_level2_followup_real")
    else:
        analysis["suggested_actions"].append("send_email_level1_real")

if "check inbox" in text_lower:
    analysis["suggested_actions"].append("check_gmail_inbox")
    analysis["suggested_actions"].append("parse_email_response_real")
```

4. **Agent asks clarifying questions** if uncertain
5. **You approve the plan** before it generates the workflow

#### **Method 2: Action Catalog Reference**

Each action has clear metadata in `lib/actions.ts`:

```typescript
send_email_level1_real: {
  name: 'Send Initial Email',
  category: 'Email (Real)',
  description: 'Send professional outreach email for shipment information',
  icon: '📧',
  required_params: ['recipient_email', 'facility'],
  optional_params: ['shipment_id', 'cc_list', 'email_template'],
  action_count: 1,  // Simple action
}
```

**Action Count Meaning:**
- **0**: Logic/routing (no external API calls)
- **1**: Simple action (single API call or operation)
- **2**: Intelligent action (uses AI/LLM)

#### **Method 3: Template Reference**

Use pre-built templates as reference:

File: `lib/enterpriseTemplates.ts`

Templates available:
- **Document Data Extraction** - Extract data from PDFs using AI
- **Email Response Workflow** - Send email, wait, check inbox, parse response
- **Escalation Workflow** - Multi-level email escalation with timeouts

Load a template → Study the actions used → Adapt for your needs

#### **Validation Checklist**

Before executing, verify:

- [ ] **Do you have a way to trigger the workflow?** (Timer, database check, manual)
- [ ] **Are all required parameters filled?** (Red * indicators)
- [ ] **Is there a logical flow?** (No dead ends, all paths lead somewhere)
- [ ] **Did you handle negative scenarios?** (What if email fails? No response?)
- [ ] **Are conditional branches labeled?** (For routing logic)

---

## 3. Adding Conditional Blocks

Conditional blocks enable **if/else logic** in your workflows.

### The Conditional Router Block

**Block ID**: `conditional_router`
**Category**: If/Else Conditions
**Icon**: 🔀

### How to Add Conditionals

#### **Step 1: Drag "Conditional Router" from Sidebar**

Find it under **"If/Else Conditions"** category in the left sidebar.

#### **Step 2: Configure Condition Parameters**

Click the node → ConfigPanel opens on right → Fill in:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `condition_field` | Field from previous node's result | `completeness`, `status`, `is_gibberish` |
| `operator` | Comparison operator | `equals`, `not_equals`, `contains`, `greater_than`, `less_than` |
| `condition_value` | Value to compare against | `complete`, `sent`, `true`, `42` |

**Example Configuration:**
```json
{
  "condition_field": "completeness",
  "operator": "equals",
  "condition_value": "complete"
}
```

#### **Step 3: Create Branching Edges**

1. **Connect conditional node to multiple target nodes**
2. **Label each edge** with the condition outcome:
   - Right-click edge → "Edit Label"
   - Or set in edge properties

**Common Labels:**
- `complete` - For complete responses
- `partial` - For partial information
- `incomplete/gibberish` - For failed responses
- `true` / `false` - For boolean conditions

#### **Step 4: How It Works at Runtime**

File: `examples/visual_workflow_builder/backend/dynamic_workflow.py:235`

```python
# After executing activity that returns:
result = {
    "completeness": "complete",
    "is_gibberish": False,
    "data": {...}
}

# Workflow checks result
if completeness == "complete" and not is_gibberish:
    route_edges = get_outgoing_edges(edges, current_node_id, "complete")
elif completeness == "partial":
    route_edges = get_outgoing_edges(edges, current_node_id, "partial")
else:  # incomplete or gibberish
    route_edges = get_outgoing_edges(edges, current_node_id, "incomplete/gibberish")

next_node = route_edges[0].target
```

### Real-World Example: Email Response Workflow

```
┌────────────────┐
│ 1. Send Email  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ 2. Wait 48hrs  │
└────────┬───────┘
         │
         ▼
┌────────────────────┐
│ 3. Check Inbox     │
└────────┬───────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Parse Response   │───┐ Result: {completeness: "complete"}
│    (AI)             │   │
└─────────────────────┘   │
         │                │
         ▼                │
┌─────────────────────┐   │
│ 5. Conditional      │◀──┘
│    Router           │
└──┬────────┬─────────┘
   │        │
   │ complete  │ incomplete/gibberish
   │        │
   ▼        ▼
┌──────┐  ┌──────────┐
│ Done │  │ Escalate │
└──────┘  └──────────┘
```

### Multiple Conditions (Advanced)

For complex logic, **chain multiple conditional routers**:

```
Input → Condition 1 (Check Status) → true → Condition 2 (Check Amount) → ...
                                  → false → Error Handler
```

---

## 4. Editing Node Parameters

Every node can be configured through the **ConfigPanel**.

### Opening ConfigPanel

**Click any node on the canvas** → ConfigPanel slides in from right

File: `components/ConfigPanel.tsx:18`

### Parameter Types

#### **1. Text Input**
```typescript
<input
  type="text"
  value={formData[paramName]}
  onChange={(e) => handleInputChange(paramName, e.target.value)}
  placeholder="Enter value..."
/>
```

**Example**: `recipient_email`, `facility`, `subject`

#### **2. Textarea (Multi-line)**
```typescript
<textarea
  value={formData[paramName]}
  onChange={(e) => handleInputChange(paramName, e.target.value)}
  rows={4}
  placeholder="Enter message..."
/>
```

**Example**: `custom_message`, `email_body`

#### **3. Number Input**
```typescript
<input
  type="number"
  value={formData[paramName]}
  onChange={(e) => handleInputChange(paramName, parseInt(e.target.value))}
/>
```

**Example**: `duration`, `wait_time`, `threshold`

#### **4. Select Dropdown**
```typescript
<select
  value={formData[paramName]}
  onChange={(e) => handleInputChange(paramName, e.target.value)}
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

**Example**: `unit` (seconds/minutes/hours), `operator` (equals/contains)

#### **5. Email Template Picker**
```typescript
<select
  value={formData.email_template}
  onChange={(e) => handleInputChange('email_template', e.target.value)}
>
  {EMAIL_TEMPLATES.map(template => (
    <option value={template.value}>{template.name}</option>
  ))}
</select>
```

**Special Feature**: Live preview of template with variable substitution

#### **6. Dynamic Schema Builder** (Advanced)

For `extract_data_from_pdf` action:

File: `components/ConfigPanel.tsx:76`

```typescript
// Define fields to extract
extraction_schema: {
  "bol_number": "Bill of Lading Number",
  "pickup_date": "Scheduled pickup date",
  "delivery_date": "Expected delivery date",
  "carrier": "Carrier name"
}
```

**UI Features**:
- Add/remove fields dynamically
- Field name + description for each
- Validation before save

### Saving Changes

1. **Fill in all required parameters** (marked with red *)
2. **Click "Save Configuration"** button
3. **ConfigPanel auto-closes** after save
4. **Node visual updates**:
   - Checkmark appears (configured=true)
   - Border changes to indicate completion

### Parameter Data Flow

```
ConfigPanel (User Input)
    ↓
Zustand Store (Frontend State)
    ↓
API Call (/api/workflows/execute)
    ↓
Temporal Workflow (Backend)
    ↓
Activity Function (Actual Execution)
```

**Example Flow**:

1. User sets `recipient_email = "john@example.com"` in ConfigPanel
2. Stored in node data: `node.data.params.recipient_email`
3. Sent to API as part of workflow JSON
4. Workflow reads params: `params = node['data']['params']`
5. Activity executes: `send_email_level1_real(params)`

### Editing After Creation

**Nodes can be edited anytime BEFORE execution:**

1. Click node
2. Modify parameters
3. Save
4. Execute updated workflow

**After execution starts, workflow is immutable** (Temporal guarantee)

---

## 5. Natural Language Workflow Creation

This is the **AI-powered feature** we just built!

### Overview

Instead of manually dragging blocks, **describe your workflow in plain English** or **upload a requirement document**, and the agent builds it for you.

### Architecture

```
┌──────────────────┐
│  User Interface  │
│  (Chat Window)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  LangGraph ReAct     │
│  Agent               │
│  (Claude Sonnet 4.5) │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  6 Specialized Tools │
│  - Read Documents    │
│  - Map Actions       │
│  - Ask Questions     │
│  - Generate Workflow │
│  - Validate          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Workflow JSON       │
│  (React Flow Format) │
└──────────────────────┘
```

### How to Use

#### **Step 1: Open Chat Builder**

(Coming soon - integration with landing page)

Or directly call API:

```bash
POST /api/workflow-agent/upload
POST /api/workflow-agent/chat
```

#### **Step 2: Upload Requirement Document or Describe**

**Option A: Upload Document**
```
User: [Uploads email_escalation_requirements.docx]

Agent: I've analyzed your document. I see you need:
       1. Initial email to facility
       2. 48-hour wait
       3. Check for response
       4. If no response, send follow-up
       5. If still no response, escalate to manager

       Is this correct?
```

**Option B: Text Description**
```
User: I need a workflow that sends an email, waits 2 days,
      checks if they replied, and if not, escalates to their manager.

Agent: Got it! Let me clarify a few things...
```

#### **Step 3: Agent Asks Clarifying Questions**

The agent uses the `generate_clarifying_questions` tool:

File: `src/agents/workflow_creation_agent.py:370`

```python
questions = [
    {
        "action": "Send Initial Email",
        "parameter": "recipient_email",
        "question": "What email address should I send to?",
        "required": True
    },
    {
        "action": "Send Initial Email",
        "parameter": "cc_list",
        "question": "Would you like to CC anyone?",
        "required": False
    },
    {
        "action": "Conditional Logic",
        "parameter": "negative_scenario",
        "question": "What should happen if there's no response after 48 hours?",
        "required": True
    }
]
```

**Conversation Example**:

```
Agent: For the 'Send Initial Email' step, what email address should I send to?

User: Send to the facility contact, we get that from our database

Agent: Got it. What should happen if there's no response after 48 hours?

User: Send a follow-up email first, then if still no response after another
      48 hours, escalate to their manager

Agent: Perfect! And who should I escalate to?

User: The escalation_recipient field in our database

Agent: Excellent. Here's the workflow plan I've created...
```

#### **Step 4: Agent Presents Plan**

```
Agent: Here's your workflow plan:

       Step 1: Send Initial Email
       - To: Facility contact (from database)
       - Template: Initial outreach

       Step 2: Wait 48 hours

       Step 3: Check Gmail Inbox
       - Filter by facility email

       Step 4: Parse Email Response (AI)
       - Extract completion status

       Step 5: Conditional Router
       - If complete → End workflow
       - If incomplete → Continue to step 6

       Step 6: Send Follow-up Email
       - Same recipient
       - Request missing info

       Step 7: Wait 48 hours

       Step 8: Check Inbox Again

       Step 9: Conditional Router
       - If complete → End
       - If still incomplete → Escalate

       Step 10: Send Escalation Email
       - To: Manager (from database)
       - Reason: No response after follow-up

       Does this look good? Should I generate the workflow?
```

#### **Step 5: User Approves**

```
User: Yes, looks perfect!

Agent: Generating your workflow now...
```

Agent calls `create_workflow_json` tool:

File: `src/agents/workflow_creation_agent.py:424`

```python
workflow = {
    "nodes": [
        {
            "id": "node-1",
            "type": "workflowNode",
            "position": {"x": 300, "y": 100},
            "data": {
                "label": "1. Send Initial Email",
                "activity": "send_email_level1_real",
                "icon": "📧",
                "params": {
                    "recipient_email": "{{facility_contact}}",
                    "facility": "{{facility_name}}",
                    "email_template": "initial_outreach"
                },
                "configured": True
            }
        },
        # ... more nodes
    ],
    "edges": [
        {"id": "edge-1", "source": "node-1", "target": "node-2"},
        {"id": "edge-2", "source": "node-2", "target": "node-3"},
        # ... more edges
    ]
}
```

#### **Step 6: Workflow Appears on Canvas**

```typescript
// WorkflowChatBuilder.tsx:202
setNodes(workflow_json.nodes);
setEdges(workflow_json.edges);
```

**User sees**:
- Complete visual workflow on canvas
- All nodes configured
- Edges properly connected
- Ready to execute or further edit

### Agent Tools Deep Dive

#### **Tool 1: read_requirement_document**
```python
@tool
def read_requirement_document(file_path: str) -> str:
    """Extract text from Word/PDF"""
    # Supports .docx, .doc, .pdf
    # Returns plain text content
```

#### **Tool 2: get_available_actions**
```python
@tool
def get_available_actions() -> str:
    """List all 11 workflow actions with descriptions"""
    # Returns ACTION_CATALOG as JSON
```

#### **Tool 3: analyze_requirement_and_map_actions**
```python
@tool
def analyze_requirement_and_map_actions(requirement_text: str) -> str:
    """Map requirements to actions using keyword analysis"""
    # Identifies needs: email, conditional, timing, documents
    # Suggests appropriate actions
    # Returns analysis JSON
```

#### **Tool 4: generate_clarifying_questions**
```python
@tool
def generate_clarifying_questions(requirement_text: str, mapped_actions: str) -> str:
    """Generate questions for missing parameters"""
    # Checks required params for each action
    # Creates conversational questions
    # Returns questions array
```

#### **Tool 5: create_workflow_json**
```python
@tool
def create_workflow_json(requirement_text: str, mapped_actions: str, user_responses: str) -> str:
    """Generate React Flow JSON"""
    # Creates nodes from actions
    # Fills in parameters from user responses
    # Generates edges for flow
    # Returns workflow JSON
```

#### **Tool 6: validate_workflow_completeness**
```python
@tool
def validate_workflow_completeness(workflow_json: str) -> str:
    """Validate all required params filled"""
    # Checks each node
    # Ensures no missing required params
    # Returns validation result
```

### Advantages of AI-Powered Creation

1. **Faster**: Seconds vs minutes of manual building
2. **Smarter**: Agent knows best practices and patterns
3. **Error-Free**: Validates completeness automatically
4. **Conversational**: Natural language, no technical knowledge needed
5. **Handles Complexity**: Automatically adds conditional branches and error handling

---

## Quick Reference

### File Locations

| Component | File | Purpose |
|-----------|------|---------|
| Workflow Executor | `examples/visual_workflow_builder/backend/dynamic_workflow.py` | Orchestrates workflow execution |
| API Server | `examples/visual_workflow_builder/backend/api.py` | REST API endpoints |
| Worker | `workers/fourkites_real_worker.py` | Executes activities |
| Actions | `src/activities/fourkites_actions.py` | Activity implementations |
| Frontend Store | `workflow-builder-fe/lib/store.ts` | State management |
| ConfigPanel | `workflow-builder-fe/components/ConfigPanel.tsx` | Node configuration UI |
| AI Agent | `src/agents/workflow_creation_agent.py` | Natural language workflow creation |

### Ports

- **Frontend**: 3003
- **API**: 8001
- **Temporal**: 7233
- **Temporal UI**: 8233

### Useful Commands

```bash
# Start frontend
cd workflow-builder-fe && npm run dev

# Start API
cd examples/visual_workflow_builder/backend && python3 api.py

# Start worker
cd workers && python3 -u fourkites_real_worker.py

# Check Temporal UI
open http://localhost:8233
```

---

## Troubleshooting

### "Workflow not executing"
- Check worker is running
- Check Temporal server is running (`temporal server start-dev`)
- Verify task queue matches ("fourkites-workflow-queue")

### "Node parameters not saving"
- Ensure you clicked "Save Configuration"
- Check ConfigPanel shows checkmark
- Verify params in browser console

### "Conditional routing not working"
- Check edge labels match condition outcomes
- Verify condition_field exists in previous node's result
- Check operator and value are correct

### "Agent not responding"
- Verify ANTHROPIC_API_KEY is set
- Check API logs for import errors
- Ensure LangGraph dependencies installed

---

**Need Help?** Check the logs:
- API: `examples/visual_workflow_builder/backend/api.py` output
- Worker: Worker terminal output
- Temporal: http://localhost:8233 → Workflow details
