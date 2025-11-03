# FourKites Workflow Builder

A production-ready, enterprise-grade visual workflow builder for FourKites automation. Built with Next.js, React Flow, and integrated with Temporal for reliable workflow orchestration.

## Quick Start

```bash
# The application is running at:
http://localhost:3003
```

Visit the landing page to explore all available action blocks, then click "Start Building" to create your workflow!

## Features

- **Landing Page**: Browse 14+ action blocks organized by category with detailed descriptions
- **Drag & Drop Canvas**: Visual workflow building with React Flow
- **Real Gmail SMTP**: Send actual emails with professional templates
- **Configuration Panel**: Configure node parameters with validation
- **Temporal Integration**: Execute workflows with full orchestration tracking
- **Beautiful UX**: Smooth animations, gradients, and responsive design

## Available Action Blocks

### Triggers (1)
- Check Database Trigger

### Email (Real) - Gmail SMTP (4)
- Send Initial Email
- Send Follow-up Email (2 actions)
- Send Escalation Email
- Send Test Email

### Documents (3)
- Parse Email Response (2 actions)
- Check Completeness
- Extract Attachments (2 actions)

### Logic (2)
- Determine Escalation
- Check Timeout

### Tools (3)
- Internal Notification
- Log Event
- Generate Report (2 actions)

## How to Use

1. **Open Landing Page**: [http://localhost:3003](http://localhost:3003)
2. **Click "Start Building"**: Navigate to the workflow builder
3. **Drag Action Blocks**: From left sidebar onto canvas
4. **Connect Nodes**: Click and drag between node handles
5. **Configure Parameters**: Click node to open config panel
6. **Execute Workflow**: Click "Execute Workflow" button
7. **Monitor Execution**: Get workflow ID and view in Temporal UI

## Architecture

```
Next.js Frontend (localhost:3003)
    ↓
FastAPI Backend (localhost:8001)
    ↓
Temporal Server (localhost:7233)
    ↓
Python Worker (fourkites-workflow-queue)
    ↓
Gmail SMTP / Activities
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Canvas**: React Flow (@xyflow/react)
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Python FastAPI
- **Orchestration**: Temporal
- **Email**: Gmail SMTP

## Project Structure

```
workflow-builder-fe/
├── app/
│   ├── page.tsx              # Landing page
│   └── builder/page.tsx      # Workflow builder
├── components/
│   ├── ActionCard.tsx        # Action cards
│   ├── ConfigPanel.tsx       # Configuration sidebar
│   ├── Sidebar.tsx           # Action blocks sidebar
│   ├── WorkflowCanvas.tsx    # React Flow canvas
│   └── WorkflowNode.tsx      # Custom node component
└── lib/
    ├── actions.ts            # Action definitions
    ├── api.ts                # Backend API client
    └── store.ts              # Zustand store
```

## Development

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm start       # Start production server
```

## Monitoring

- **Temporal UI**: http://localhost:8233
- **Backend API**: http://localhost:8001
- **Frontend**: http://localhost:3003

## Example Workflows

### Simple Test
1. Drag "Send Test Email"
2. Configure recipient (optional)
3. Execute workflow
4. Check inbox

### Email Escalation
1. "Check Database Trigger"
2. Connect to "Send Initial Email"
3. Connect to "Parse Email Response"
4. Connect to "Check Completeness"
5. Branch to "Send Follow-up" or "Send Escalation"
6. Configure all nodes
7. Execute

## Environment

`.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Backend Services Required

1. Temporal Server: `temporal server start-dev`
2. Python Worker: `python3 fourkites_real_worker.py`
3. FastAPI Backend: `python3 api.py`

---

**Built for FourKites** | Powered by Next.js, React Flow & Temporal
