# Frontend-Backend Connection Guide

## Overview

This guide explains how the Next.js frontend connects to the Python FastAPI backend and how to sync changes between them.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│                    localhost:3003                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Interface                                               │
│  ├─ Landing Page (app/page.tsx)                             │
│  │  └─ Shows action blocks from lib/actions.ts              │
│  │                                                            │
│  └─ Builder Page (app/builder/page.tsx)                     │
│     ├─ Sidebar (components/Sidebar.tsx)                     │
│     ├─ Canvas (components/WorkflowCanvas.tsx)               │
│     └─ ConfigPanel (components/ConfigPanel.tsx)             │
│                                                               │
│  State Management                                             │
│  └─ Zustand Store (lib/store.ts)                            │
│     ├─ Nodes (workflow blocks)                              │
│     ├─ Edges (connections)                                   │
│     └─ Selected node                                         │
│                                                               │
│  API Client (lib/api.ts)                                     │
│  └─ Functions:                                               │
│     ├─ fetchActionBlocks() → GET /api/actions               │
│     ├─ executeWorkflow()   → POST /api/workflows/execute    │
│     └─ checkHealth()       → GET /health                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
                    (fetch API calls)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Python FastAPI)                      │
│                    localhost:8001                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Endpoints (api.py)                                       │
│  ├─ GET  /api/actions                                        │
│  │  └─ Returns FOURKITES_ACTION_BLOCKS                      │
│  ├─ POST /api/workflows/execute                             │
│  │  └─ Starts Temporal workflow                             │
│  └─ GET  /health                                             │
│                                                               │
│  Action Registry (src/activities/fourkites_actions.py)      │
│  └─ FOURKITES_ACTION_BLOCKS = {...}                         │
│     ├─ send_email_level1                                     │
│     ├─ send_email_level2_followup                           │
│     ├─ check_response_completeness                          │
│     └─ ... (11 total)                                        │
│                                                               │
│  Real Email Activities (src/activities/real_email_actions.py)│
│  └─ Gmail SMTP implementations                               │
│     ├─ send_email_level1_real                               │
│     ├─ send_email_level2_followup_real                      │
│     ├─ send_email_level3_escalation_real                    │
│     └─ send_test_email_real                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Temporal Client
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                TEMPORAL SERVER                               │
│                    localhost:7233                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ├─ Workflow Orchestration                                   │
│  ├─ Task Queue: fourkites-workflow-queue                    │
│  └─ Workflow Execution History                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Execute Activities
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                TEMPORAL WORKER                               │
│         (workers/fourkites_real_worker.py)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Registered Activities (15 total)                            │
│  ├─ 11 from fourkites_actions.py                            │
│  └─ 4 from real_email_actions.py                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Connection Points

### 1. Environment Configuration

**Frontend**: `workflow-builder-fe/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

**Backend**: Uses port 8001 by default
```python
# api.py line 187
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### 2. API Client (Frontend → Backend)

**Location**: [workflow-builder-fe/lib/api.ts](workflow-builder-fe/lib/api.ts)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Fetch action blocks
export async function fetchActionBlocks() {
  const response = await fetch(`${API_BASE_URL}/api/actions`);
  return await response.json();
}

// Execute workflow
export async function executeWorkflow(workflow: WorkflowDefinition) {
  const response = await fetch(`${API_BASE_URL}/api/workflows/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  return await response.json();
}
```

### 3. Action Registry (Backend)

**Location**: [src/activities/fourkites_actions.py:622](file:///Users/msp.raja/temporal-project/src/activities/fourkites_actions.py#L622)

```python
FOURKITES_ACTION_BLOCKS = {
    "send_email_level1": {
        "name": "Send Initial Email",
        "category": "Email",
        "description": "Send initial outreach email",
        "action_count": 1,
        "icon": "📧",
        "color": "#3B82F6",
        "activity": send_email_level1,
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            {"name": "template", "type": "select", "options": [...]},
        ]
    },
    # ... more actions
}
```

### 4. API Endpoints (Backend)

**Location**: [examples/visual_workflow_builder/backend/api.py](file:///Users/msp.raja/temporal-project/examples/visual_workflow_builder/backend/api.py)

```python
@app.get("/api/actions")
async def get_actions():
    """Returns all action blocks from FOURKITES_ACTION_BLOCKS"""
    return {
        "total": len(FOURKITES_ACTION_BLOCKS),
        "categories": by_category  # Grouped by category
    }

@app.post("/api/workflows/execute")
async def execute_workflow(workflow: WorkflowDefinition):
    """Executes workflow in Temporal"""
    client = await Client.connect("localhost:7233")
    handle = await client.start_workflow(
        DynamicWorkflowExecutor.run,
        workflow.dict(),
        id=workflow_id,
        task_queue="fourkites-workflow-queue"
    )
    return {
        "workflow_id": workflow_id,
        "run_id": handle.first_execution_run_id
    }
```

## How to Sync UI and Backend

### Scenario 1: Adding a New Action Block

#### Step 1: Create Python Activity

**File**: `src/activities/your_new_actions.py`

```python
from temporalio import activity
from typing import Dict, Any
import asyncio

@activity.defn
async def your_new_action(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Your new action implementation
    """
    # Your logic here
    facility = params.get("facility")
    custom_param = params.get("custom_param")

    # Simulate work
    await asyncio.sleep(1)

    return {
        "status": "success",
        "result": f"Processed {facility}",
        "data": custom_param
    }
```

#### Step 2: Register in FOURKITES_ACTION_BLOCKS

**File**: `src/activities/fourkites_actions.py` (or your_new_actions.py)

```python
FOURKITES_ACTION_BLOCKS = {
    # ... existing actions ...

    "your_new_action": {
        "name": "Your New Action",
        "category": "Custom",  # Choose: Email, Data Extraction, Logic, Notification, etc.
        "description": "What your action does in detail",
        "action_count": 1,  # 1 for simple, 2 if uses LLM/AI
        "icon": "🔧",  # Choose an emoji
        "color": "#8B5CF6",  # Hex color
        "activity": your_new_action,  # The function reference
        "config_fields": [
            {
                "name": "facility",
                "type": "string",
                "required": True,
                "default": None
            },
            {
                "name": "custom_param",
                "type": "select",
                "required": False,
                "options": ["option1", "option2", "option3"],
                "default": "option1"
            },
            {
                "name": "cc_list",
                "type": "array",
                "required": False,
                "default": []
            }
        ]
    }
}
```

#### Step 3: Register in Worker

**File**: `workers/fourkites_real_worker.py`

```python
from src.activities.your_new_actions import your_new_action

# In the worker setup
worker = Worker(
    client,
    task_queue="fourkites-workflow-queue",
    workflows=[DynamicWorkflowExecutor],
    activities=[
        # ... existing activities ...
        your_new_action,  # Add your new activity
    ],
)
```

#### Step 4: Update Frontend Action Definitions

**File**: `workflow-builder-fe/lib/actions.ts`

```typescript
export const ACTION_BLOCKS: Record<string, ActionBlockDefinition> = {
  // ... existing actions ...

  your_new_action: {
    id: 'your_new_action',
    name: 'Your New Action',
    category: ACTION_CATEGORIES.TOOLS,  // Match backend category
    description: 'What your action does in detail',
    icon: '🔧',  // Match backend icon
    gradient: 'from-purple-500 to-violet-500',  // Choose gradient
    action_count: 1,  // Match backend action_count
    required_params: ['facility'],  // Must match backend
    optional_params: ['custom_param', 'cc_list'],  // Must match backend
    param_descriptions: {
      facility: 'The facility to process',
      custom_param: 'Custom parameter for action',
      cc_list: 'Comma-separated list of CC emails',
    },
  },
};
```

#### Step 5: Restart Services

```bash
# 1. Restart Worker (to register new activity)
# Kill old worker: Ctrl+C
cd /Users/msp.raja/temporal-project/workers
python3 fourkites_real_worker.py

# 2. Restart Backend (to load new action block)
# Kill old backend: Ctrl+C
cd /Users/msp.raja/temporal-project/examples/visual_workflow_builder/backend
python3 api.py

# 3. Frontend auto-reloads (Next.js hot reload)
# If not, restart:
cd /Users/msp.raja/temporal-project/workflow-builder-fe
npm run dev
```

#### Step 6: Test in UI

1. Visit [http://localhost:3003](http://localhost:3003)
2. Your new action should appear in the landing page
3. Click "Start Building"
4. Find your action in the left sidebar
5. Drag it to canvas
6. Configure parameters
7. Connect to other nodes
8. Execute workflow

---

### Scenario 2: Modifying Existing Action Parameters

#### Backend Changes

**File**: `src/activities/fourkites_actions.py`

```python
FOURKITES_ACTION_BLOCKS = {
    "send_email_level1": {
        # ... existing fields ...
        "config_fields": [
            {"name": "facility", "type": "string", "required": True},
            # ADD NEW PARAMETER
            {"name": "priority", "type": "select", "options": ["low", "medium", "high"], "default": "medium"},
        ]
    }
}
```

#### Frontend Changes

**File**: `workflow-builder-fe/lib/actions.ts`

```typescript
export const ACTION_BLOCKS = {
  send_email_level1: {
    // ... existing fields ...
    optional_params: ['shipment_id', 'priority'],  // Add 'priority'
    param_descriptions: {
      facility: 'Facility name',
      shipment_id: 'Optional shipment ID',
      priority: 'Email priority level (low, medium, high)',  // Add description
    },
  },
};
```

**Restart**: Backend only (worker + api.py)

---

### Scenario 3: Changing Action Category

#### Backend

```python
FOURKITES_ACTION_BLOCKS = {
    "your_action": {
        "category": "New Category Name",  # Change this
        # ...
    }
}
```

#### Frontend

```typescript
// Add new category if needed
export const ACTION_CATEGORIES = {
  // ... existing ...
  NEW_CATEGORY: 'New Category Name',  // Must match backend
};

// Update action
export const ACTION_BLOCKS = {
  your_action: {
    category: ACTION_CATEGORIES.NEW_CATEGORY,  // Use new category
    // ...
  },
};

// Add category info
export function getCategoryInfo(category: string) {
  const info = {
    // ... existing ...
    'New Category Name': {
      icon: '🎯',
      description: 'Description of new category',
      gradient: 'from-green-600 to-teal-600',
    },
  };
  // ...
}
```

---

### Scenario 4: Debugging Connection Issues

#### Check Backend is Running

```bash
# Health check
curl http://localhost:8001/health

# Should return:
{
  "status": "healthy",
  "temporal": "connected",
  "actions_loaded": 11
}
```

#### Check Frontend Environment

```bash
cat workflow-builder-fe/.env.local

# Should show:
NEXT_PUBLIC_API_URL=http://localhost:8001
```

#### Check CORS

**File**: `api.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (dev only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Browser Console

Open DevTools → Network tab → Check:
- ❌ Failed requests to localhost:8001
- ✅ Successful 200 responses

---

## Data Flow Examples

### Example 1: Loading Landing Page

```
1. User visits http://localhost:3003
2. page.tsx calls getActionsByCategory()
3. getActionsByCategory() reads lib/actions.ts (local data)
4. Renders action cards from local ACTION_BLOCKS
5. No backend call needed (static data)
```

### Example 2: Executing Workflow

```
1. User clicks "Execute Workflow" button
2. builder/page.tsx calls executeWorkflow(workflowDef)
3. lib/api.ts → fetch POST http://localhost:8001/api/workflows/execute
4. api.py receives workflow definition
5. api.py connects to Temporal (localhost:7233)
6. Temporal starts workflow in queue
7. Worker picks up workflow
8. Worker executes activities in sequence
9. api.py returns {workflow_id, run_id}
10. Frontend shows success modal with IDs
```

### Example 3: Workflow Execution Flow

```
Frontend Node Definition:
{
  id: "node1",
  data: {
    activity: "send_email_level1_real",
    params: {
      recipient_email: "test@example.com",
      facility: "Chicago Warehouse"
    }
  }
}
    ↓
Backend Receives:
{
  nodes: [
    {
      id: "node1",
      type: "trigger",
      activity: "send_email_level1_real",
      params: {
        recipient_email: "test@example.com",
        facility: "Chicago Warehouse"
      },
      next: []
    }
  ]
}
    ↓
Temporal Worker Executes:
await send_email_level1_real({
  recipient_email: "test@example.com",
  facility: "Chicago Warehouse"
})
    ↓
Gmail SMTP sends email
    ↓
Returns result to Temporal
    ↓
Workflow completes
```

---

## Quick Reference

### Frontend Files to Update
- **Action Definitions**: `lib/actions.ts`
- **API Client**: `lib/api.ts` (rarely needs changes)
- **Types**: `lib/store.ts` (if changing data structure)

### Backend Files to Update
- **Action Registry**: `src/activities/fourkites_actions.py`
- **New Activities**: Create new file in `src/activities/`
- **Worker Registration**: `workers/fourkites_real_worker.py`
- **API Endpoints**: `examples/visual_workflow_builder/backend/api.py` (rarely)

### Restart Checklist
After making changes:

- ✅ **Backend Changes**: Restart `api.py` and `worker.py`
- ✅ **Frontend Changes**: Next.js auto-reloads (or restart `npm run dev`)
- ✅ **Activity Changes**: Restart worker only
- ✅ **API Changes**: Restart api.py only

---

## Important Notes

1. **Two Sources of Truth**:
   - Backend: `FOURKITES_ACTION_BLOCKS` (Python dict)
   - Frontend: `ACTION_BLOCKS` (TypeScript object)
   - These MUST be manually synced

2. **Action IDs Must Match**:
   ```python
   # Backend
   "send_email_level1_real": { ... }
   ```
   ```typescript
   // Frontend
   send_email_level1_real: { ... }
   ```

3. **Parameter Names Must Match**:
   - Backend `config_fields[].name`
   - Frontend `required_params` / `optional_params`

4. **Worker Must Register Activities**:
   - Adding activity in `fourkites_actions.py` is not enough
   - Must also add to worker's `activities=[]` list

5. **Frontend is Static**:
   - Currently uses hardcoded `lib/actions.ts`
   - Could be enhanced to fetch from `/api/actions` dynamically
   - Trade-off: Performance vs. auto-sync

---

## Future Enhancements

### Dynamic Action Loading

Currently frontend uses static definitions. Could be changed to:

```typescript
// lib/api.ts - already exists but not used
export async function fetchActionBlocks() {
  const response = await fetch(`${API_BASE_URL}/api/actions`);
  return await response.json();
}

// app/page.tsx - could use dynamic loading
useEffect(() => {
  fetchActionBlocks().then(blocks => {
    setActionBlocks(blocks);
  });
}, []);
```

**Pros**: Auto-sync, single source of truth
**Cons**: Slower initial load, requires backend

---

## Support

- **Frontend Issues**: Check browser console, Network tab
- **Backend Issues**: Check terminal logs, `curl` endpoints
- **Temporal Issues**: Visit [http://localhost:8233](http://localhost:8233)
- **Email Issues**: Check `.env` file, test with `send_test_email_real`

**All Services Running?**
```bash
# Temporal UI
http://localhost:8233

# Backend API
http://localhost:8001/health

# Frontend
http://localhost:3003
```
