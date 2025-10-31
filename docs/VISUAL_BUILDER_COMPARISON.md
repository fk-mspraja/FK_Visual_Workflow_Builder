# Visual Workflow Builder Comparison: Sim vs React Flow

## Executive Summary

For FourKites' conversational workflow builder, we need to choose between:

1. **Sim Studio** - Full-featured open-source AI agent workflow platform
2. **React Flow** - Flexible node-based UI library (build from scratch)

**Recommendation: Use React Flow (custom build)**

**Rationale**: Better control, FourKites-specific customization, and integration with existing Temporal + LangGraph architecture.

---

## Detailed Analysis

### Option 1: Sim Studio (simstudioai/sim)

#### What is Sim?

Sim is a complete open-source platform for building AI agent workflows with:
- Visual workflow editor (built on React Flow)
- Multi-model AI support (OpenAI, Anthropic, Gemini, local models)
- Knowledge base and semantic search
- Real-time collaboration
- Cloud-hosted or self-hosted

#### Pros ✅

**1. Ready-Made Solution**
- Complete workflow builder UI out of the box
- Professional, polished interface
- Pre-built components for common patterns
- Active development (17.4k stars, 86 releases)

**2. Built-In Features**
- Node-based visual editor (ReactFlow under the hood)
- Multi-user collaboration
- Real-time updates via Socket.io
- Authentication system (Better Auth)
- Background job processing (Trigger.dev)

**3. Modern Tech Stack**
- Next.js with App Router
- TypeScript + Tailwind CSS
- PostgreSQL with pgvector
- Drizzle ORM
- Zustand state management

**4. AI-First Design**
- Built for AI agent workflows
- Supports multiple LLM providers
- Vector embeddings integrated
- Knowledge base system

**5. Open Source**
- Apache 2.0 license (permissive)
- Can fork and customize
- Active community

#### Cons ❌

**1. Opinionated Architecture**
- Designed for general AI agents, not Temporal workflows
- May have features you don't need
- Harder to customize deeply

**2. Heavy Dependencies**
- Requires PostgreSQL with pgvector
- Needs Socket.io server
- Trigger.dev for background jobs
- Docker for deployment
- Bun runtime (though Node works)

**3. Integration Challenges**
- Built for Sim's workflow execution model
- Would need significant adaptation for Temporal
- LangGraph agent integration not straightforward
- May conflict with your architecture

**4. Learning Curve**
- Team needs to learn Sim's architecture
- Understand their workflow model
- Navigate their abstractions

**5. Maintenance Burden**
- Need to keep up with Sim updates
- Risk of diverging from upstream
- May break with major updates

**6. Over-Engineering**
- Brings features you might not need:
  - Remote code execution (E2B)
  - Built-in LLM orchestration
  - Their own job system
  - Copilot features

**7. Not FourKites-Specific**
- Generic AI workflow builder
- Doesn't match your exact domain
- UI optimized for general use, not FourKites actions

#### Sim's Architecture vs Your Needs

```
┌──────────────────────────────────────────┐
│           Sim's Architecture             │
├──────────────────────────────────────────┤
│  Frontend: Next.js + ReactFlow           │
│  Backend: Bun + PostgreSQL               │
│  Execution: Sim's own runtime            │ ← Don't need this
│  Jobs: Trigger.dev                       │ ← Temporal handles this
│  AI: Built-in LLM orchestration          │ ← LangGraph handles this
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│       Your Required Architecture         │
├──────────────────────────────────────────┤
│  Frontend: Visual Builder                │ ← Only need this from Sim
│  Agent: LangGraph                        │
│  Execution: Temporal                     │
│  Activities: FourKites action library    │
└──────────────────────────────────────────┘
```

**Mismatch**: Sim brings its own execution model, but you need Temporal. Sim has built-in AI orchestration, but you have LangGraph.

---

### Option 2: React Flow (Custom Build)

#### What is React Flow?

React Flow is a library for building node-based UIs and editors. It provides:
- Node-based canvas
- Drag-and-drop
- Custom node types
- Edge connections
- Zooming, panning
- Layouting algorithms

#### Pros ✅

**1. Perfect Fit for Your Architecture**
- Build exactly what you need
- No extra features to strip out
- Direct integration with LangGraph + Temporal
- Custom nodes for FourKites actions

**2. Full Control**
- Customize every aspect
- No architectural conflicts
- FourKites-specific UI/UX
- Optimize for your use cases

**3. Lightweight**
- Only React Flow library (~400KB)
- No unnecessary dependencies
- No PostgreSQL requirement
- No extra backend services

**4. Flexibility**
- Choose your own state management
- Use your preferred UI library
- Integrate with existing systems
- Deploy however you want

**5. Learn Once, Use Forever**
- React Flow is stable library
- Well-documented
- Large community
- Won't change your architecture

**6. FourKites-Specific**
- Design for FourKites actions
- Custom node types (email, parse, LLM, etc.)
- Domain-specific UI elements
- Optimized workflows for your use cases

**7. No Vendor Lock-In**
- Not tied to Sim's updates
- Not dependent on their decisions
- No risk of project abandonment
- Full ownership

#### Cons ❌

**1. Build from Scratch**
- Need to implement UI components
- Build authentication system
- Create backend API
- Implement collaboration (if needed)

**2. Development Time**
- 3-4 weeks vs. potentially faster with Sim
- Need frontend developers
- More testing required

**3. No Ready-Made Features**
- No built-in collaboration
- No template library
- Need to build everything

**4. Maintenance**
- Your team maintains everything
- Need to fix bugs
- Handle security updates

#### React Flow Architecture for FourKites

```
┌──────────────────────────────────────────────────────────┐
│               Frontend (React + React Flow)              │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │         Custom Workflow Canvas                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Trigger  │→ │  Email   │→ │   Wait   │     │    │
│  │  │  Node    │  │   Node   │  │   Node   │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  │                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │Condition │  │   LLM    │  │   End    │     │    │
│  │  │  Node    │  │  Node    │  │  Node    │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Chat Interface (LangGraph)              │    │
│  │  User: "Add CC field to email 2"                │    │
│  │  Agent: "Done! Updated email_2 node."          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Property Panel                          │    │
│  │  Selected Node: email_2                         │    │
│  │  • Template: initial_outreach                   │    │
│  │  • CC: ops@fourkites.com                        │    │
│  │  • Timeout: 300s                                │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────┬───────────────────────────────────────┘
                   │ Workflow JSON
                   ▼
┌──────────────────────────────────────────────────────────┐
│                 Backend API (FastAPI)                    │
├──────────────────────────────────────────────────────────┤
│  • Save/load workflow definitions                        │
│  • Validate workflows                                    │
│  • Deploy to Temporal                                    │
│  • Query action library                                  │
│  • LangGraph agent endpoints                             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LangGraph + Temporal                        │
└──────────────────────────────────────────────────────────┘
```

---

## Detailed Comparison

| Aspect | Sim Studio | React Flow (Custom) | Winner |
|--------|-----------|---------------------|--------|
| **Time to MVP** | 2 weeks (adapt existing) | 4 weeks (build from scratch) | 🟢 Sim |
| **Architecture Fit** | Poor (own execution model) | Perfect (matches your stack) | 🟢 React Flow |
| **Customization** | Medium (fork + modify) | High (full control) | 🟢 React Flow |
| **Learning Curve** | High (learn Sim) | Low (just React Flow) | 🟢 React Flow |
| **Dependencies** | Heavy (PG, Socket.io, etc) | Light (just React Flow) | 🟢 React Flow |
| **Maintenance** | Track Sim updates | Self-maintained | 🟡 Tie |
| **FourKites-Specific** | No (generic) | Yes (tailored) | 🟢 React Flow |
| **Integration** | Complex (adapt Sim) | Simple (direct) | 🟢 React Flow |
| **Cost** | Free (open source) | Free (library) | 🟡 Tie |
| **Features** | Many out-of-box | Build what you need | 🟢 Sim |
| **Flexibility** | Limited by Sim | Unlimited | 🟢 React Flow |
| **Community** | Growing | Large (React Flow) | 🟢 React Flow |
| **Long-term** | Dependent on Sim | Full control | 🟢 React Flow |

---

## Recommendation: React Flow (Custom Build)

### Why React Flow Wins

#### 1. **Perfect Architectural Fit**

Sim brings its own execution model, but you already have Temporal. This creates conflict:

```
❌ With Sim:
User → Sim UI → Need to adapt Sim's execution → Temporal
                     ↑ Friction point

✅ With React Flow:
User → Custom UI → Direct → Temporal
                      ↑ Clean integration
```

#### 2. **No Over-Engineering**

Sim includes features you don't need:
- ❌ Sim's job system (Trigger.dev) - You have Temporal
- ❌ Sim's AI orchestration - You have LangGraph
- ❌ Remote code execution (E2B) - Not needed
- ❌ Built-in LLM handling - LangGraph does this

With React Flow, you build only what you need.

#### 3. **FourKites-Specific Design**

Custom nodes for your domain:

```typescript
// Custom node types for FourKites
<TriggerNode icon="database" />
<EmailNode provider="ses" />
<ParseNode fields={["date", "tracking"]} />
<LLMNode model="claude" />
<EscalationNode level={2} />
```

Sim has generic nodes. You can make domain-specific ones.

#### 4. **Full Control Over UX**

Design workflows optimized for FourKites:
- Custom validation rules
- FourKites branding
- Specific action parameters
- Domain terminology

#### 5. **Simpler Stack**

```
Sim Stack:
- Next.js
- PostgreSQL + pgvector
- Socket.io
- Trigger.dev
- Bun
- Better Auth
- E2B
- Drizzle ORM

Your Stack:
- React + React Flow
- Your existing DB
- FastAPI backend
- Temporal
- LangGraph
```

Less complexity = easier to maintain.

#### 6. **Long-Term Ownership**

- ✅ Not dependent on Sim's roadmap
- ✅ No risk of project abandonment
- ✅ Full control over features
- ✅ No breaking updates from upstream

---

## React Flow Implementation Plan

### Phase 1: Core Canvas (Week 1)

**Goal**: Basic workflow visualization

```typescript
// Basic React Flow setup
import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from 'reactflow';

function WorkflowCanvas() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

**Deliverables**:
- [ ] Basic canvas with pan/zoom
- [ ] Node positioning
- [ ] Edge connections
- [ ] Minimap for navigation

### Phase 2: Custom Node Types (Week 2)

**Goal**: FourKites-specific nodes

```typescript
// Custom node components
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  wait: WaitNode,
  condition: ConditionNode,
  end: EndNode,
};

// Example: Email Action Node
function ActionNode({ data }) {
  return (
    <div className="action-node">
      <div className="node-header">
        <Mail size={16} />
        <span>{data.name}</span>
      </div>
      <div className="node-body">
        <div>Activity: {data.activity}</div>
        <div>Timeout: {data.timeout}s</div>
      </div>
      <Handle type="source" position="bottom" />
    </div>
  );
}
```

**Deliverables**:
- [ ] Trigger node component
- [ ] Action node component
- [ ] Wait node component
- [ ] Condition node component
- [ ] End node component
- [ ] Node styling and icons

### Phase 3: Node Property Panel (Week 2)

**Goal**: Edit node parameters

```typescript
function PropertyPanel({ selectedNode, onUpdate }) {
  if (!selectedNode) return <div>Select a node</div>;

  return (
    <div className="property-panel">
      <h3>{selectedNode.data.name}</h3>

      {/* Dynamic form based on node type */}
      {selectedNode.type === 'action' && (
        <>
          <Input
            label="Activity"
            value={selectedNode.data.activity}
            onChange={(v) => onUpdate('activity', v)}
          />
          <Input
            label="Timeout"
            type="number"
            value={selectedNode.data.timeout}
            onChange={(v) => onUpdate('timeout', v)}
          />
          <ObjectEditor
            label="Parameters"
            value={selectedNode.data.params}
            onChange={(v) => onUpdate('params', v)}
          />
        </>
      )}
    </div>
  );
}
```

**Deliverables**:
- [ ] Property panel UI
- [ ] Form inputs for each node type
- [ ] Real-time updates
- [ ] Parameter validation

### Phase 4: Chat Integration (Week 3)

**Goal**: Chat with LangGraph agent

```typescript
function ChatPanel({ workflowId, onWorkflowUpdate }) {
  const [messages, setMessages] = useState([]);

  async function sendMessage(text) {
    // Call LangGraph agent
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({
        workflow_id: workflowId,
        message: text,
      }),
    });

    const data = await response.json();

    // Agent might update workflow
    if (data.workflow_updated) {
      onWorkflowUpdate(data.workflow);
    }

    setMessages([...messages,
      { role: 'user', content: text },
      { role: 'agent', content: data.message }
    ]);
  }

  return (
    <div className="chat-panel">
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

**Deliverables**:
- [ ] Chat interface
- [ ] LangGraph agent API integration
- [ ] Workflow updates from chat
- [ ] Visual diff highlighting

### Phase 5: Advanced Features (Week 4)

**Goal**: Polish and production features

**Deliverables**:
- [ ] Workflow validation
- [ ] Auto-layout algorithm
- [ ] Export/import workflows
- [ ] Workflow templates
- [ ] Undo/redo
- [ ] Keyboard shortcuts
- [ ] Collaborative editing (optional)

---

## Technology Stack for Custom Build

```typescript
// Frontend
{
  "framework": "React 18+",
  "language": "TypeScript",
  "styling": "Tailwind CSS + Shadcn UI",
  "canvas": "React Flow v11+",
  "state": "Zustand or Redux Toolkit",
  "forms": "React Hook Form + Zod",
  "api": "TanStack Query (React Query)",
  "websockets": "Socket.io-client (optional)"
}

// Backend
{
  "framework": "FastAPI",
  "language": "Python 3.11+",
  "database": "PostgreSQL",
  "orm": "SQLAlchemy",
  "validation": "Pydantic",
  "websockets": "FastAPI WebSockets (optional)",
  "agent": "LangGraph",
  "execution": "Temporal"
}
```

---

## Sample React Flow Implementation

### 1. Custom Node Example

```typescript
// components/nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { Mail, Database, MessageSquare } from 'lucide-react';

const iconMap = {
  send_email: Mail,
  query_database: Database,
  parse_email: MessageSquare,
};

export function ActionNode({ data, selected }) {
  const Icon = iconMap[data.activity] || Mail;

  return (
    <div
      className={`
        rounded-lg border-2 bg-white p-4 shadow-md
        ${selected ? 'border-blue-500' : 'border-gray-300'}
      `}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <span className="font-semibold">{data.name}</span>
      </div>

      <div className="text-sm text-gray-600">
        <div>Activity: {data.activity}</div>
        <div>Timeout: {data.timeout}s</div>
      </div>

      {data.params.template && (
        <div className="mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
          Template: {data.params.template}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### 2. Workflow Canvas

```typescript
// components/WorkflowCanvas.tsx
import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ActionNode } from './nodes/ActionNode';
import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

export function WorkflowCanvas({ workflow, onWorkflowChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    // Update selected node in parent
    onWorkflowChange({ selectedNodeId: node.id });
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### 3. Property Panel

```typescript
// components/PropertyPanel.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const actionNodeSchema = z.object({
  name: z.string().min(1),
  activity: z.string().min(1),
  timeout: z.number().positive(),
  params: z.record(z.any()),
});

export function PropertyPanel({ node, onUpdate }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(actionNodeSchema),
    defaultValues: node.data,
  });

  const onSubmit = (data) => {
    onUpdate(node.id, data);
  };

  if (!node) {
    return (
      <div className="p-4 text-gray-500">
        Select a node to edit its properties
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        {node.type} Node
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            {...register('name')}
            className="w-full border rounded px-3 py-2"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Activity
          </label>
          <select
            {...register('activity')}
            className="w-full border rounded px-3 py-2"
          >
            <option value="send_email_ses">Send Email (SES)</option>
            <option value="parse_email">Parse Email</option>
            <option value="query_database">Query Database</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Timeout (seconds)
          </label>
          <input
            type="number"
            {...register('timeout', { valueAsNumber: true })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Update Node
        </button>
      </form>
    </div>
  );
}
```

### 4. Main Workflow Builder

```typescript
// pages/WorkflowBuilder.tsx
import { useState } from 'react';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { PropertyPanel } from '../components/PropertyPanel';
import { ChatPanel } from '../components/ChatPanel';

export function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState({
    id: 'email-escalation-v1',
    nodes: [],
    edges: [],
    selectedNodeId: null,
  });

  const selectedNode = workflow.nodes.find(
    n => n.id === workflow.selectedNodeId
  );

  const handleNodeUpdate = (nodeId, data) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, data } : n
      ),
    }));
  };

  const handleWorkflowUpdate = (updates) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-screen flex">
      {/* Main Canvas */}
      <div className="flex-1">
        <WorkflowCanvas
          workflow={workflow}
          onWorkflowChange={handleWorkflowUpdate}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-96 border-l flex flex-col">
        {/* Property Panel (top half) */}
        <div className="flex-1 border-b overflow-auto">
          <PropertyPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
          />
        </div>

        {/* Chat Panel (bottom half) */}
        <div className="flex-1 overflow-auto">
          <ChatPanel
            workflowId={workflow.id}
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Cost-Benefit Analysis

### Sim Studio

**Costs:**
- 2 weeks integration time
- Ongoing maintenance tracking Sim
- Architecture conflicts to resolve
- Learning curve for team

**Benefits:**
- Quick start
- Professional UI
- Some features out-of-box

**Total**: Higher long-term cost due to maintenance burden

### React Flow (Custom)

**Costs:**
- 4 weeks development time
- Build everything from scratch
- Ongoing maintenance

**Benefits:**
- Perfect fit for architecture
- Full control and customization
- FourKites-specific features
- No vendor lock-in
- Simpler stack

**Total**: Higher upfront cost, lower long-term cost

---

## Final Recommendation

### ✅ Go with React Flow (Custom Build)

**Reasons:**
1. **Better Architecture Fit** - Direct integration with Temporal + LangGraph
2. **Full Control** - Customize everything for FourKites
3. **Lighter Stack** - No unnecessary dependencies
4. **Long-Term Benefits** - No vendor lock-in
5. **Team Ownership** - Full understanding of codebase

### 📋 Action Plan

**Week 1:**
- [ ] Set up React + TypeScript project
- [ ] Install React Flow
- [ ] Create basic canvas
- [ ] Implement pan/zoom/minimap

**Week 2:**
- [ ] Build custom node components
- [ ] Implement node types (trigger, action, wait, condition, end)
- [ ] Add property panel
- [ ] Connect to backend API

**Week 3:**
- [ ] Integrate chat interface
- [ ] Connect to LangGraph agent
- [ ] Handle workflow updates from chat
- [ ] Add visual diff highlights

**Week 4:**
- [ ] Add validation
- [ ] Implement auto-layout
- [ ] Create workflow templates
- [ ] Add export/import
- [ ] Polish UI/UX

**Total**: 4 weeks to production-ready visual builder

---

## Alternative: Hybrid Approach (Not Recommended)

You *could* try to use Sim's UI but replace its backend:

```
Sim Frontend (ReactFlow UI)
     ↓
Your Backend (FastAPI)
     ↓
LangGraph + Temporal
```

**Problems:**
- Still heavy frontend dependencies
- Sim's UI expects Sim's backend
- Breaking changes with Sim updates
- Most work is adapting, not building

**Verdict**: More trouble than building custom.

---

## Conclusion

**Build custom with React Flow.**

You get:
✅ Perfect fit for your architecture
✅ FourKites-specific features
✅ Full control and flexibility
✅ Lighter, simpler stack
✅ Long-term ownership

Sim is impressive but not the right fit. It's designed for its own execution model, not Temporal workflows.

**Next Step**: Start with Week 1 of the React Flow implementation plan.

