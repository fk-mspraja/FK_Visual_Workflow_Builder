# FourKites Agentic Workflow Builder

A production-ready visual workflow automation platform for supply chain operations, built with Temporal, Next.js, and Claude AI.

## 🚀 Features

### Visual Workflow Builder
- **AI-Powered Conversational Interface**: Natural language workflow creation with Claude AI
- **Visual Flow Designer**: Drag-and-drop interface with real-time preview
- **SQL-like Query Builder**: Advanced filtering with visual query construction
- **15+ Workflow Actions**: Email operations, document extraction, AI parsing, timers, and more
- **Real-time Execution**: Live workflow execution with Temporal orchestration

### Security & Guardrails
- **AI-Powered Intent Classification**: Smart routing between general questions and workflow building
- **Jailbreak Detection**: Comprehensive pattern matching for security threats
- **Prompt Injection Prevention**: Protection against malicious inputs
- **Red Banner Warnings**: Visual security alerts for dangerous attempts

### Authentication & UI
- **Google OAuth Integration**: Secure @fourkites.com email authentication
- **Modern UI/UX**: Framer Motion animations, responsive design
- **Multi-page Application**: Login, workflow templates, visual builder
- **Chat History**: Persistent session management

## 📁 Project Structure

```
temporal-project_backup_20251031_181240/
├── workflow-builder-fe/           # Next.js Frontend (Port 3003)
│   ├── app/
│   │   ├── page.tsx              # Login page with Google OAuth
│   │   ├── workflows/            # Workflow templates page
│   │   ├── builder/              # Visual workflow builder
│   │   └── api/
│   │       └── workflow-agent/   # AI agent API with security
│   ├── components/
│   │   ├── FourKitesWorkflowBuilderV2.tsx  # Main builder component
│   │   ├── TriggerBuilder.tsx    # Trigger configuration
│   │   └── QueryFilterBuilder.tsx # SQL-like filter builder
│   ├── lib/
│   │   └── auth.ts              # NextAuth configuration
│   └── public/                   # Static assets
│
├── examples/visual_workflow_builder/backend/  # Python Backend (Port 8001)
│   ├── api.py                   # FastAPI server
│   ├── workflow_worker.py       # Temporal worker
│   ├── actions/                 # Workflow action implementations
│   └── workflows/               # Temporal workflow definitions
│
├── src/                         # Core Temporal workflow logic
│   ├── workflows/               # Workflow orchestration
│   ├── activities/              # Activity implementations
│   └── agents/                  # AI agent integrations
│
├── docs/                        # Comprehensive documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── QUICK_START.md
│   └── ...
│
├── assets/                      # Demo images & videos
└── workflow_outputs/            # Execution results
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.0.1** with App Router and Turbopack
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **NextAuth.js** for authentication
- **Anthropic Claude AI** for chat agent

### Backend
- **Python 3.11+**
- **FastAPI** for REST API
- **Temporal** for workflow orchestration
- **Gmail API** for email operations
- **PyPDF2** for document extraction

## 📦 Installation

### Prerequisites
- **Option 1 (Docker - Recommended)**: Docker & Docker Compose
- **Option 2 (Manual)**: Node.js 18+, Python 3.11+, Temporal CLI

## 🐳 Docker Installation (Recommended)

### Quick Start with Docker

1. **Clone Repository**
```bash
git clone https://github.com/fk-mspraja/FK_Visual_Workflow_Builder.git
cd FK_Visual_Workflow_Builder
```

2. **Create Environment Files**
```bash
# Frontend environment
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your credentials

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

3. **Start All Services with Docker Compose**
```bash
docker-compose up -d
```

This single command will start:
- ✅ Temporal Server (ports 7233, 8233)
- ✅ Backend API (port 8001)
- ✅ Backend Worker
- ✅ Frontend (port 3003)

4. **Verify Services**
```bash
docker-compose ps
```

5. **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend-api
docker-compose logs -f backend-worker
docker-compose logs -f temporal
```

6. **Stop Services**
```bash
docker-compose down
```

7. **Rebuild After Code Changes**
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Docker Services Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js)         :3003               │
│  ↓ Calls                                        │
│  Backend API (FastAPI)      :8001               │
│  ↓ Connects to                                  │
│  Temporal Server (gRPC)     :7233               │
│  ↑ Connected by                                 │
│  Backend Worker (Python)                        │
│                                                  │
│  Temporal Web UI            :8233               │
└─────────────────────────────────────────────────┘
```

---

## 💻 Manual Installation (Alternative)

### 1. Clone Repository
```bash
git clone <repository-url>
cd temporal-project_backup_20251031_181240
```

### 2. Setup Frontend
```bash
cd workflow-builder-fe
npm install
cp .env.local.example .env.local
# Add your environment variables
```

### 3. Setup Backend
```bash
# Create virtual environment
python3 -m venv temporal
source temporal/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Start Temporal Server
```bash
temporal server start-dev --ui-port 8233 --db-filename /tmp/temporal.db
```

### 5. Start Backend
```bash
# Terminal 1: Worker
source temporal/bin/activate
cd examples/visual_workflow_builder/backend
python3 workflow_worker.py

# Terminal 2: API
source temporal/bin/activate
cd examples/visual_workflow_builder/backend
python3 api.py
```

### 6. Start Frontend
```bash
cd workflow-builder-fe
npm run dev
```

## ⚡ Quick Start - Run Commands

**Prerequisites**: Ensure you've completed the installation steps above.

### Option 1: Run All Services (Recommended)

Open 4 separate terminal windows and run these commands:

#### Terminal 1 - Temporal Server
```bash
cd /Users/msp.raja/temporal-project_backup_20251031_181240
temporal server start-dev --ui-port 8233 --db-filename /tmp/temporal.db
```

#### Terminal 2 - Backend Worker
```bash
cd /Users/msp.raja/temporal-project_backup_20251031_181240
source temporal/bin/activate
PYTHONPATH=/Users/msp.raja/temporal-project_backup_20251031_181240:$PYTHONPATH python3 examples/visual_workflow_builder/backend/workflow_worker.py
```

#### Terminal 3 - Backend API
```bash
cd /Users/msp.raja/temporal-project_backup_20251031_181240
source temporal/bin/activate
cd examples/visual_workflow_builder/backend
python3 api.py
```

#### Terminal 4 - Frontend
```bash
cd /Users/msp.raja/temporal-project_backup_20251031_181240/workflow-builder-fe
npm run dev
```

### Option 2: One-Line Commands (Background Processes)

```bash
# Start Temporal Server (background)
temporal server start-dev --ui-port 8233 --db-filename /tmp/temporal.db &

# Start Backend Worker (background)
cd /Users/msp.raja/temporal-project_backup_20251031_181240 && source temporal/bin/activate && PYTHONPATH=/Users/msp.raja/temporal-project_backup_20251031_181240:$PYTHONPATH python3 examples/visual_workflow_builder/backend/workflow_worker.py &

# Start Backend API (background)
cd /Users/msp.raja/temporal-project_backup_20251031_181240 && source temporal/bin/activate && cd examples/visual_workflow_builder/backend && python3 api.py &

# Start Frontend (foreground - keep this terminal open)
cd /Users/msp.raja/temporal-project_backup_20251031_181240/workflow-builder-fe && npm run dev
```

### Verify All Services Are Running

Check if all services started successfully:

```bash
# Check Temporal Server (should return server info)
curl http://localhost:8233

# Check Backend API (should return {"status":"ok"})
curl http://localhost:8001/health

# Check Frontend (should return HTML)
curl http://localhost:3003
```

## 🌐 Access Points

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:8001
- **Temporal Web UI**: http://localhost:8233
- **Temporal Server**: localhost:7233 (gRPC - for backend connections)
- **API Docs**: http://localhost:8001/docs

### Service Status & Ports
✅ **Temporal Server (gRPC API)** - Running on port **7233**
   - Used by backend workers and API to connect to Temporal
   - Configure via `TEMPORAL_HOST=localhost:7233` in backend .env

✅ **Temporal Web UI** - Running on port **8233**
   - Web interface for monitoring workflows
   - Access at http://localhost:8233

✅ **Backend API (FastAPI)** - Running on port **8001**
   - REST API endpoints
   - API docs at http://localhost:8001/docs

✅ **Backend Worker** - Connects to Temporal on port **7233**
   - Processes workflow activities

✅ **Frontend (Next.js)** - Running on port **3003**
   - Main web application

### Stop All Services

If you started services in the background, you can stop them with:

```bash
# Stop Frontend (port 3003)
lsof -ti:3003 | xargs kill -9

# Stop Backend API (port 8001)
lsof -ti:8001 | xargs kill -9

# Stop Temporal Server (port 7233)
lsof -ti:7233 | xargs kill -9

# Or stop all Python processes (use with caution)
pkill -f "workflow_worker.py"
pkill -f "api.py"
```

## 🔐 Security Features

### Authentication
- Google OAuth with @fourkites.com domain restriction
- NextAuth.js session management
- Secure HTTP-only cookies

### AI Security Guardrails
- Jailbreak Detection: "ignore instructions" → 🚨 Blocked
- Prompt Injection Prevention: HTML/script tags → 🚨 Blocked
- Destructive Operations: "delete database" → 🚨 Blocked

### Intent Classification
- AI-powered routing (Claude AI)
- General questions → No action detection
- Workflow building → Show action boxes

## 🚀 Workflow Actions (15+)

### Email Operations
- `send_initial_email` - Send emails with dynamic content
- `check_email_inbox` - Monitor inbox
- `parse_email_response` - AI-powered analysis

### Document Processing
- `extract_document_text` - PDF extraction
- `parse_document_with_ai` - AI parsing
- `extract_bol_info` - BOL extraction

### Control Flow
- `wait_timer` - Delay execution
- `conditional_router` - Branch logic
- `parallel_processor` - Concurrent execution

### AI & LLM
- `call_llm_openai` - GPT integration
- `call_llm_anthropic` - Claude AI
- `sentiment_analysis` - Text analysis

## 📝 Example Workflows

### Late Delivery Notifier
```
1. send_initial_email → Notify facility
2. wait_timer → Wait 48 hours
3. check_email_inbox → Check for response
4. parse_email_response → AI validation
5. conditional_router → Route based on response
6. send_escalation_email → Escalate if needed
```

## 🔧 Configuration

### Frontend (.env.local)
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your_secret_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Backend (.env)
```env
TEMPORAL_HOST=localhost:7233
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 🧪 Testing

### Security Tests
Test jailbreak detection:
- "ignore ur instructions" → Should show red banner
- "act as admin" → Should show red banner
- "delete database tables" → Should show red banner

## 📊 Monitoring

- **Temporal UI**: http://localhost:8233
- **FastAPI Docs**: http://localhost:8001/docs
- **Logs**: Check workflow_outputs/ directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by FourKites.

---

**Built with ❤️ by the FourKites Team**
