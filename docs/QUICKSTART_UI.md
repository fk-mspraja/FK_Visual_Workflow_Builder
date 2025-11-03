# FourKites Workflow Builder - Quick Start Guide 🚀

## ✅ All Systems Running!

Your complete FourKites workflow builder is now live and ready to use.

---

## 🌐 Access the UI

### **Visual Workflow Builder**
**URL**: **http://localhost:5173/index.html**

Open this URL in your browser to start building workflows!

---

## 📊 System Status

### Running Services:

1. **✅ Frontend (React Flow UI)**
   - URL: http://localhost:5173/index.html
   - Status: Running
   - Features:
     - Drag-and-drop action blocks
     - Visual workflow canvas
     - Export to JSON
     - Execute workflows directly

2. **✅ Backend API**
   - URL: http://localhost:8001
   - API Docs: http://localhost:8001/docs
   - Health Check: http://localhost:8001/health
   - Status: Running

3. **✅ FourKites Worker**
   - Task Queue: `fourkites-workflow-queue`
   - Registered Actions: 11 blocks
   - Status: Running and ready

4. **✅ Temporal Server**
   - URL: http://localhost:7233
   - Monitor UI: http://localhost:8233
   - Status: Running

---

## 🎯 How to Use

### Step 1: Open the Workflow Builder

Navigate to: **http://localhost:5173/index.html**

You'll see:
- **Left Sidebar**: 11 action blocks organized by category
- **Canvas**: Drag blocks here to build your workflow
- **Toolbar**: Export, Clear, and Execute buttons
- **Status Bar**: Shows node count, connections, and total actions

### Step 2: Build a Workflow

**Example: Simple Email Workflow**

1. **Drag "Check Database Trigger"** from the Trigger category onto the canvas
   - This MUST be your first node (workflows require a trigger)

2. **Drag "Send Initial Email"** from the Email category

3. **Connect them**: Click and drag from the circle on the right of the trigger node to the circle on the left of the email node

4. **Your first workflow is ready!**

### Step 3: Execute the Workflow

Click the **"▶️ Execute Workflow"** button in the toolbar.

The workflow will:
- Check the database for pending shipments
- Send an initial email to the facility contact
- Complete in ~2 seconds

You'll see a success message with the workflow ID.

### Step 4: Monitor Execution

Visit the Temporal UI to see your workflow running:
**http://localhost:8233**

---

## 📦 Available Action Blocks

### Triggers (1)
- **🔍 Check Database Trigger** (2 actions)
  - Checks database for pending shipments
  - Returns facility contact information

### Email Actions (3)
- **📧 Send Initial Email** (1 action)
  - First outreach to facility

- **📧 Send Follow-up Email** (2 actions)
  - LLM-generated follow-up for incomplete info

- **🚨 Send Escalation Email** (1 action)
  - Escalation to higher-level contact

### Data Processing (1)
- **📄 Parse Email Response** (1 action)
  - Extracts structured data from email replies

### Decision Blocks (2)
- **🔍 Check Completeness** (2 actions)
  - LLM-based analysis of response completeness
  - Branches: complete / incomplete / contains_questions

- **⚖️ Check Escalation Limit** (1 action)
  - Checks if escalation limit reached

### Notifications (2)
- **🔔 Notify Internal (Questions)** (1 action)
  - Alerts internal team when customer has questions

- **🚨 Notify Escalation Limit** (1 action)
  - Alerts when max escalations reached

### Utilities (2)
- **➕ Track Escalation** (1 action)
  - Increments escalation counter

- **📝 Log Action** (variable actions)
  - Logs workflow actions for audit trail

---

## 🎨 UI Features

### Drag and Drop
- Grab any action block from the sidebar
- Drag it onto the canvas
- Drop to place

### Connect Nodes
- Click the small circle on the right of a node
- Drag to the circle on the left of another node
- Connection created!

### Node Information
- Each node shows its icon and name
- Action count displayed below
- Selected nodes highlight in purple

### Toolbar Actions

**🗑️ Clear**
- Removes all nodes and connections from canvas
- Confirmation dialog prevents accidents

**💾 Export JSON**
- Downloads workflow as JSON file
- Use this to save workflows for later
- Can be loaded and executed via API

**▶️ Execute Workflow**
- Sends workflow to Temporal for execution
- Shows success message with workflow ID
- Runs in background (worker processes it)

### Status Bar
- **Nodes**: Total number of action blocks on canvas
- **Connections**: Total number of edges
- **Total Actions**: Sum of all action counts (for billing/analytics)
- **Worker**: Task queue name

---

## 📝 Example Workflows

### Simple 2-Node Workflow

**Nodes:**
1. Check Database Trigger
2. Send Initial Email

**Connection:**
Trigger → Email

**Result:** Checks database and sends email to facility

**Total Actions:** 3 (2 + 1)

---

### Complete Escalation Workflow

**Nodes:**
1. Check Database Trigger
2. Send Initial Email
3. Wait for Response (can be added via JSON)
4. Parse Email Response
5. Check Completeness
6. If incomplete → Send Follow-up Email
7. If no response → Send Escalation Email
8. Track Escalation
9. Check Escalation Limit
10. If limit reached → Notify Internal

**Total Actions:** 15-20 (varies by path)

---

## 🔧 Troubleshooting

### UI Not Loading?

Check that the server is running:
```bash
curl http://localhost:5173/index.html
```

If not, restart:
```bash
cd /Users/msp.raja/temporal-project/examples/visual_workflow_builder/frontend
python3 -m http.server 5173
```

### Backend API Not Responding?

Check API health:
```bash
curl http://localhost:8001/health
```

Should return:
```json
{
  "status": "healthy",
  "temporal": "connected",
  "actions_loaded": 11
}
```

If not running, restart:
```bash
cd /Users/msp.raja/temporal-project/examples/visual_workflow_builder/backend
python3 api.py
```

### Worker Not Processing Workflows?

Check if worker is running:
```bash
lsof -i :7233
```

Restart worker:
```bash
cd /Users/msp.raja/temporal-project/workers
python3 fourkites_worker.py
```

### Workflow Execution Fails?

**Error: "Workflow must start with a trigger node"**
- Solution: Add a "Check Database Trigger" node as your first node

**Error: "Backend not responding"**
- Solution: Make sure backend API is running on port 8001
- Check: http://localhost:8001/health

**Error: "Worker not found"**
- Solution: Ensure FourKites worker is running
- Task queue must be: `fourkites-workflow-queue`

---

## 📚 API Endpoints

### Get Action Blocks
```bash
curl http://localhost:8001/api/actions
```

Returns all 11 action blocks with metadata.

### Execute Workflow
```bash
curl -X POST http://localhost:8001/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Get Workflow Status
```bash
curl http://localhost:8001/api/workflows/{workflow_id}
```

### Health Check
```bash
curl http://localhost:8001/health
```

---

## 🎓 Tips & Best Practices

### 1. Always Start with a Trigger
Every workflow MUST begin with "Check Database Trigger" node.

### 2. Connect Logically
Connect nodes in the order they should execute:
- Trigger → Action → Decision → Action

### 3. Test Simple First
Build a 2-3 node workflow first to test the system.

### 4. Monitor in Temporal UI
Use http://localhost:8233 to see real-time execution.

### 5. Export Frequently
Save your workflows by clicking "Export JSON".

### 6. Check Action Counts
Status bar shows total actions for cost estimation.

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Workflow Builder** | http://localhost:5173/index.html | Main UI |
| **Backend API** | http://localhost:8001 | Workflow execution |
| **API Documentation** | http://localhost:8001/docs | Interactive API docs |
| **Temporal Monitor** | http://localhost:8233 | Workflow monitoring |
| **Health Check** | http://localhost:8001/health | System status |

---

## 🎉 You're Ready!

Everything is set up and running. Open the workflow builder and start creating!

**Next Steps:**
1. Open http://localhost:5173/index.html
2. Drag a "Check Database Trigger" onto the canvas
3. Drag a "Send Initial Email" below it
4. Connect them
5. Click "Execute Workflow"
6. Watch it run in Temporal UI!

---

## 📞 Support

For issues or questions:
- Check [FOURKITES_ACTIONS_GUIDE.md](FOURKITES_ACTIONS_GUIDE.md) for action block details
- Check [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) for system architecture
- Review sample workflows in [examples/sample_workflows/](examples/sample_workflows/)

---

**Built with:**
- React Flow (visual workflow builder)
- FastAPI (backend API)
- Temporal (workflow orchestration)
- Python 3.13

🚀 Happy workflow building!
