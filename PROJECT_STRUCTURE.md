# Project Structure

## FourKites Agentic Workflow Builder
Production-ready visual workflow automation platform for supply chain operations.

```
temporal-project_backup_20251031_181240/
├── README.md                      # Main project documentation
├── .gitignore                     # Git ignore rules
├── .env                          # Environment variables (not committed)
├── PROJECT_STRUCTURE.md          # This file
│
├── workflow-builder-fe/          # 🎨 Next.js Frontend (Port 3003)
│   ├── app/
│   │   ├── page.tsx             # Login page with Google OAuth
│   │   ├── workflows/           # Workflow templates gallery
│   │   ├── builder/             # Visual workflow builder
│   │   └── api/
│   │       ├── auth/            # NextAuth API routes
│   │       └── workflow-agent/  # AI agent API with security
│   ├── components/
│   │   ├── FourKitesWorkflowBuilderV2.tsx  # Main builder component
│   │   ├── TriggerBuilder.tsx              # Trigger configuration
│   │   ├── QueryFilterBuilder.tsx          # SQL-like filter builder
│   │   └── ChatHistorySidebar.tsx          # Chat history management
│   ├── lib/
│   │   └── auth.ts              # NextAuth configuration
│   ├── public/                   # Static assets (logos, icons)
│   ├── package.json
│   └── tsconfig.json
│
├── examples/visual_workflow_builder/backend/  # 🐍 Python Backend (Port 8001)
│   ├── api.py                   # FastAPI REST API server
│   ├── workflow_worker.py       # Temporal worker process
│   ├── actions/                 # Workflow action implementations
│   │   ├── email_actions.py
│   │   ├── document_actions.py
│   │   ├── ai_actions.py
│   │   └── timer_actions.py
│   └── workflows/               # Temporal workflow definitions
│       └── dynamic_workflow.py
│
├── src/                         # ⚙️ Core Temporal Logic
│   ├── workflows/               # Workflow orchestration
│   │   └── workflows.py
│   ├── activities/              # Activity implementations
│   │   └── activities.py
│   └── agents/                  # AI agent integrations
│
├── docs/                        # 📚 Comprehensive Documentation
│   ├── ARCHITECTURE.md          # System architecture & design
│   ├── DEPLOYMENT_GUIDE.md      # Production deployment guide
│   ├── QUICK_START.md           # Getting started guide
│   ├── AI_WORKFLOW_BUILDER_SUMMARY.md
│   ├── FOURKITES_ACTIONS_GUIDE.md
│   ├── REAL_EMAIL_SETUP.md
│   ├── PRODUCTION_READY_STATUS.md
│   └── ...                      # Additional guides
│
├── tests/                       # 🧪 Test Files
│   ├── test_ai_email_parsing.py
│   ├── test_ai_extraction.py
│   ├── test_email_workflow.py
│   ├── test_email_simple.py
│   └── ...                      # Additional test files
│
├── assets/                      # 🎬 Demo Assets
│   ├── demo_videos/
│   └── screenshots/
│
├── monitoring/                  # 📊 Monitoring Tools
│   ├── list_workflows.py
│   ├── list_failed_workflows.py
│   └── monitor_workflows.py
│
├── workers/                     # 👷 Worker Processes
│   ├── worker.py
│   └── worker_with_failing.py
│
├── workflow_outputs/            # 📁 Execution Results (ignored by git)
│
└── temporal/                    # 🔧 Virtual Environment (ignored by git)
```

## Key Directories

### Frontend (`workflow-builder-fe/`)
- **Next.js 16.0.1** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** + **Framer Motion**
- **NextAuth.js** for Google OAuth
- **Claude AI** integration for chat

### Backend (`examples/visual_workflow_builder/backend/`)
- **FastAPI** REST API
- **Temporal** workflow orchestration
- **15+ Workflow Actions**
- **Gmail API** integration

### Documentation (`docs/`)
- Architecture guides
- Deployment instructions
- API references
- Security documentation

### Tests (`tests/`)
- Email workflow tests
- AI extraction tests
- Integration tests
- SMTP tests

## Configuration Files

### Frontend
- `workflow-builder-fe/.env.local` - Environment variables
- `workflow-builder-fe/next.config.ts` - Next.js configuration
- `workflow-builder-fe/tailwind.config.ts` - Tailwind CSS config

### Backend
- `.env` - Backend environment variables (root)
- `requirements.txt` - Python dependencies (if exists)

## Ignored Directories (not committed to git)
- `node_modules/` - NPM packages
- `temporal/` - Python virtual environment
- `.next/` - Next.js build output
- `__pycache__/` - Python cache
- `workflow_outputs/` - Execution results
- `.env` files - Sensitive credentials

## Access Points

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Temporal UI**: http://localhost:8233

## Recent Updates

### Latest Features (Nov 2025)
1. **AI-Powered Intent Classification** - Smart routing using Claude AI
2. **Enhanced Security** - Jailbreak detection, prompt injection prevention
3. **SQL-like Query Builder** - Visual filter construction with 15+ operators
4. **Red Security Alerts** - Visual warnings for dangerous attempts
5. **Improved UX** - Better error messages and guardrails

### Security Features
- Google OAuth with domain restriction (@fourkites.com)
- AI-powered jailbreak detection
- Prompt injection prevention
- Destructive operation blocking
- Red banner warnings for threats

---

**Maintained by**: FourKites Engineering Team
**Last Updated**: November 2025
