# Conditional Logic & Custom Nodes Guide

## 📚 Table of Contents
1. [How If/Else Currently Works](#how-ifelse-currently-works)
2. [Visual Conditional Nodes (New!)](#visual-conditional-nodes)
3. [Creating Custom Nodes from Scratch](#creating-custom-nodes-from-scratch)
4. [Why Email Response Test Shows Hidden Nodes](#why-email-response-test-shows-hidden-nodes)

---

## 🔀 How If/Else Currently Works

### **You're Already Using If/Else!**

Your "Email Response Test (LIVE)" workflow uses **labeled edges** for conditional routing:

```typescript
// From enterpriseTemplates.ts
edges: [
  { source: 'parse-response', target: 'route-complete', label: 'complete' },
  { source: 'parse-response', target: 'route-partial', label: 'partial' },
  { source: 'parse-response', target: 'route-gibberish', label: 'incomplete/gibberish' }
]
```

### **How It Works:**

```
┌──────────────────────────────────────────────────────────────┐
│  3. AI Parse Response (Claude)                               │
│  Activity: parse_email_response_real                         │
│  Returns: {                                                  │
│    completeness: "complete" | "partial" | "incomplete"      │
│    is_gibberish: true/false                                 │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ VisualWorkflowExecutor checks result
                         ▼
         ┌───────────────┼───────────────┐
         │               │               │
    completeness    completeness    completeness
    == "complete"   == "partial"    == "incomplete"
         │               │               │
         ▼               ▼               ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ Path A │      │ Path B │      │ Path C │
    │Success │      │Follow-up│      │Escalate│
    └────────┘      └────────┘      └────────┘
```

### **Worker Code** (`VisualWorkflowExecutor`):

```python
async def _get_next_node(self, current_node_id, current_result, edges, nodes):
    """Intelligent conditional routing"""
    outgoing_edges = get_outgoing_edges(edges, current_node_id)

    if len(outgoing_edges) == 1:
        return outgoing_edges[0].get("target")

    # Multiple edges - conditional routing
    if isinstance(current_result, dict):
        completeness = current_result.get("completeness")

        if completeness == "complete":
            route_edges = get_outgoing_edges(edges, current_node_id, "complete")
        elif completeness == "partial":
            route_edges = get_outgoing_edges(edges, current_node_id, "partial")
        else:  # incomplete or gibberish
            route_edges = get_outgoing_edges(edges, current_node_id, "incomplete/gibberish")

        if route_edges:
            return route_edges[0].get("target")

    # Default: take first edge
    return outgoing_edges[0].get("target")
```

---

## 🎨 Visual Conditional Nodes (New!)

I just created **10 visual conditional node types** for easy drag-and-drop if/else logic:

### **1. If/Else Condition** 🔀
**Use Case**: Simple binary decision

**Example**:
```
Input: { status: "delivered" }
Condition: status == "delivered"
├─ TRUE → send_confirmation
└─ FALSE → check_again
```

**Parameters**:
- `condition_field`: "status"
- `condition_operator`: "equals"
- `condition_value`: "delivered"

---

### **2. If/ElseIf/Else Condition** 🔀🔀
**Use Case**: Three-way branching (like email completeness)

**Example**:
```
Input: { completeness: "partial", is_gibberish: false }
Condition 1: completeness == "complete"
Condition 2: completeness == "partial"
├─ IF (complete) → success_path
├─ ELIF (partial) → followup_path
└─ ELSE → escalation_path
```

**Parameters**:
- `condition1_field`: "completeness"
- `condition1_value`: "complete"
- `condition2_field`: "completeness"
- `condition2_value`: "partial"

---

### **3. Switch (Multi-way)** 🎛️
**Use Case**: Route based on multiple values (like switch/case)

**Example**:
```
Input: { priority: "urgent" }
Switch on: priority
├─ "low" → standard_process
├─ "medium" → expedite_process
├─ "high" → priority_process
├─ "urgent" → immediate_action
└─ default → standard_process
```

**Parameters**:
- `switch_field`: "priority"
- `cases`: `[{"value": "low", "label": "standard"}, {"value": "urgent", "label": "immediate"}]`

---

### **4. Check Completeness** ✅❓❌
**Use Case**: Pre-configured for email parsing (what you're using now!)

**Example**:
```
Input: { completeness: "incomplete" }
├─ complete → success
├─ partial → followup
└─ incomplete → escalation
```

**Parameters**:
- `completeness_field`: "completeness" (default)

---

### **5. Compare Numbers** 🔢
**Use Case**: Numeric thresholds

**Example**:
```
Input: { temperature: 50 }
Threshold: 45
├─ above → alert_temperature_high
└─ below/equal → continue
```

**Parameters**:
- `number_field`: "temperature"
- `threshold`: 45
- `comparison`: "greater_than"

---

### **6. Match String Pattern** 🔤
**Use Case**: String matching (contains, regex, etc.)

**Example**:
```
Input: { tracking_number: "FEDEX-12345" }
Pattern: "FEDEX"
├─ match → fedex_process
└─ no_match → other_carrier_process
```

**Parameters**:
- `string_field`: "tracking_number"
- `pattern`: "FEDEX"
- `match_type`: "contains"

---

### **7. Check Timeout** ⏱️
**Use Case**: Time-based routing

**Example**:
```
Input: { sent_at: "2025-10-29T10:00:00Z" }
Now: "2025-10-29T12:30:00Z"
Timeout: 7200 seconds (2 hours)
├─ timeout → escalate
└─ not_timeout → wait_more
```

**Parameters**:
- `timestamp_field`: "sent_at"
- `timeout_seconds`: 7200

---

### **8. Check List Empty** 📋
**Use Case**: Check if array/list has items

**Example**:
```
Input: { missing_fields: [] }
├─ empty → all_complete
└─ not_empty → request_more_info
```

---

### **9. Check Field Exists** ❓
**Use Case**: Null/undefined checking

**Example**:
```
Input: { tracking_number: null }
├─ exists → process_tracking
└─ not_exists → request_tracking
```

---

### **10. Evaluate Boolean Expression** 🧮
**Use Case**: Complex logic with AND/OR/NOT

**Example**:
```
Input: { status: "delivered", pod_received: false, days_since_delivery: 3 }
Expression: "(status == delivered) AND (pod_received == false) AND (days_since_delivery > 2)"
├─ true → request_pod_urgently
└─ false → continue
```

---

## 🛠️ Creating Custom Nodes from Scratch

Want to add your own custom node type? Here's how:

### **Step 1: Define Action Block**

Add to `/lib/actions.ts`:

```typescript
export const ACTION_BLOCKS: Record<string, ActionBlockDefinition> = {
  // ... existing blocks ...

  my_custom_node: {
    id: 'my_custom_node',
    name: 'My Custom Node',
    category: ACTION_CATEGORIES.LOGIC,
    description: 'Does something custom',
    icon: '⚡',
    gradient: 'from-blue-500 to-purple-600',
    action_count: 1,
    required_params: ['param1', 'param2'],
    optional_params: ['param3'],
    param_descriptions: {
      param1: 'Description of parameter 1',
      param2: 'Description of parameter 2',
      param3: 'Optional parameter 3',
    },
  },
};
```

### **Step 2: Create Python Activity**

Add to `/workers/fourkites_real_worker.py` (or create new activity file):

```python
from temporalio import activity

@activity.defn
async def my_custom_node(params: dict) -> dict:
    """
    Custom activity implementation
    """
    param1 = params.get('param1')
    param2 = params.get('param2')
    param3 = params.get('param3', 'default_value')

    # Your custom logic here
    result = do_something_custom(param1, param2, param3)

    # Return result (can include routing info)
    return {
        'status': 'success',
        'result': result,
        'route_to': 'path_a'  # Optional: for conditional routing
    }

def do_something_custom(param1, param2, param3):
    # Your implementation
    return {"data": "custom result"}
```

### **Step 3: Register Activity in Worker**

Add to worker's activities list:

```python
from my_activities import my_custom_node

activities = [
    # ... existing activities ...
    my_custom_node,  # Add your custom activity
]

worker = Worker(
    client,
    task_queue="fourkites-workflow-queue",
    workflows=[VisualWorkflowExecutor],
    activities=activities,
)
```

### **Step 4: Use in Workflow**

Now you can drag and drop your custom node in the visual builder!

---

## 🔍 Why Email Response Test Shows "Hidden" Nodes

The "Email Response Test (LIVE)" workflow has **7 nodes total**:

1. ✅ **send-initial** (Send Initial Email) - VISIBLE in left panel
2. ✅ **wait-reply** (Wait 45s) - VISIBLE in left panel
3. ✅ **parse-response** (AI Parse) - VISIBLE in left panel
4. ✅ **route-complete** (Success path) - VISIBLE in left panel (log_activity)
5. ✅ **route-partial** (Follow-up path) - VISIBLE in left panel (send_email_level2_followup_real)
6. ✅ **route-gibberish** (Escalation path) - VISIBLE in left panel (send_email_level3_escalation_real)
7. ✅ **final-log** (Log final state) - VISIBLE in left panel (log_activity)

### **All nodes ARE visible!**

They're just **categorized under different sections**:

- **Email (Real)** category:
  - Send Initial Email
  - Send Follow-up Email
  - Send Escalation Email
  - AI Parse Response

- **Logic** category:
  - Wait 45s for Reply

- **Tools** category:
  - Log Activity (used twice: route-complete, final-log)

### **The "Branching" Effect**

The template shows 3 parallel paths after parsing:

```
parse-response
    ├─ route-complete (Path A)
    ├─ route-partial (Path B)
    └─ route-gibberish (Path C)
         │
         All merge → final-log
```

This is **conditional routing**, not hidden nodes. Only ONE path executes based on the AI's decision!

---

## 📊 Comparison: Current vs New Approach

### **Current Approach (Edge Labels)**

```typescript
// Manual edge labeling
edges: [
  { source: 'parse', target: 'success', label: 'complete' },
  { source: 'parse', target: 'followup', label: 'partial' },
]

// Worker must understand edge labels
if (completeness == "complete"):
    route_to_edge_with_label("complete")
```

**Pros**:
- ✅ Simple, works today
- ✅ Flexible

**Cons**:
- ❌ Not visually clear
- ❌ User must understand edge labels
- ❌ Worker code must handle each routing case

---

### **New Approach (Dedicated Conditional Nodes)**

```typescript
// Visual conditional node
nodes: [
  {
    id: 'if-complete',
    activity: 'if_else_condition',
    params: {
      condition_field: 'completeness',
      condition_operator: 'equals',
      condition_value: 'complete'
    }
  }
]

// Edges come from node, not manual labels
edges: [
  { source: 'parse', target: 'if-complete' },
  { source: 'if-complete', target: 'success' },  // true path
  { source: 'if-complete', target: 'followup' }, // false path
]
```

**Pros**:
- ✅ Visually clear diamond-shaped conditional node
- ✅ Self-documenting (parameters visible in node)
- ✅ Reusable logic
- ✅ Easier for non-technical users

**Cons**:
- ⚠️ Requires new worker activities (which I just created!)

---

## 🚀 Next Steps

### **To Add Conditional Nodes to UI:**

1. **Integrate conditional actions** into main actions file
2. **Add new category filter** in Sidebar ("If/Else Conditions")
3. **Update worker** to handle new conditional activities
4. **Test with visual builder**

### **To Create Your Own Custom Node:**

1. Follow the 4-step process above
2. Define block in `actions.ts`
3. Create Python activity
4. Register in worker
5. Drag and drop in UI!

---

## 💡 Pro Tips

### **Tip 1: Edge Labels Still Work**
You can still use edge labels for quick conditional routing without creating dedicated nodes.

### **Tip 2: Combine Approaches**
Use conditional nodes for complex logic, edge labels for simple branches.

### **Tip 3: Custom Node Ideas**
- Database query conditional (route based on query result)
- API call conditional (route based on response code)
- File existence check
- Permission validator
- Rate limiter

### **Tip 4: Debugging Conditionals**
Always add `log_activity` nodes after conditional splits to see which path was taken!

---

## 📝 Summary

**Current System**:
- ✅ Already has if/else via edge labels
- ✅ Works with `VisualWorkflowExecutor`
- ✅ Handles complex routing (Email Response Test proves this!)

**New Additions**:
- 🎨 10 visual conditional node types
- 🔧 Evaluation helper functions
- 📖 Complete guide for custom nodes

**Why "Hidden" Nodes**:
- Not hidden! Just spread across categories
- Conditional routing creates branching (only 1 path executes)
- All 7 nodes visible in left sidebar

---

Need help implementing any of these? Let me know! 🚀
