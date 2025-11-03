# 🏗️ Repository Restructure Plan
## FourKites AI Workflow Builder - Clean Architecture

**Current Status**: Cluttered with scattered files
**Target Status**: Clean, organized, production-ready structure

---

## 📁 NEW REPOSITORY STRUCTURE

```
fourkites-workflow-builder/
├── README.md                          # Main project documentation
├── LICENSE
├── .gitignore
├── docker-compose.yml                 # All services orchestration
├── Makefile                           # Common commands (make dev, make prod, etc.)
│
├── docs/                              # 📚 Documentation
│   ├── README.md
│   ├── architecture/
│   │   ├── system-design.md
│   │   ├── data-flow.md
│   │   └── deployment.md
│   ├── api/
│   │   ├── backend-api.md
│   │   └── temporal-api.md
│   ├── guides/
│   │   ├── getting-started.md
│   │   ├── development.md
│   │   └── deployment.md
│   └── audits/
│       ├── production-audit.md
│       └── security-review.md
│
├── backend/                           # 🐍 Python Backend API
│   ├── README.md
│   ├── requirements.txt
│   ├── setup.py
│   ├── pytest.ini
│   ├── .env.example
│   │
│   ├── app/                          # Main application
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Configuration management
│   │   ├── dependencies.py           # Dependency injection
│   │   │
│   │   ├── api/                      # API routes
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflows.py     # Workflow endpoints
│   │   │   │   ├── agent.py         # AI agent endpoints
│   │   │   │   └── health.py        # Health checks
│   │   │   └── dependencies.py
│   │   │
│   │   ├── core/                     # Core business logic
│   │   │   ├── __init__.py
│   │   │   ├── session_store.py     # Session management
│   │   │   ├── auth.py              # Authentication
│   │   │   └── security.py          # Security utilities
│   │   │
│   │   ├── agents/                   # AI Agents
│   │   │   ├── __init__.py
│   │   │   ├── workflow_agent.py    # LangGraph ReAct agent
│   │   │   ├── tools/               # Agent tools
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document_tools.py
│   │   │   │   ├── workflow_tools.py
│   │   │   │   └── validation_tools.py
│   │   │   └── prompts/             # Agent prompts
│   │   │       ├── __init__.py
│   │   │       └── workflow_builder.py
│   │   │
│   │   ├── models/                   # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── requests.py
│   │   │   ├── responses.py
│   │   │   └── workflows.py
│   │   │
│   │   └── utils/                    # Utilities
│   │       ├── __init__.py
│   │       ├── logger.py
│   │       ├── validators.py
│   │       └── helpers.py
│   │
│   ├── tests/                        # Tests
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_agent.py
│   │   │   └── test_session_store.py
│   │   ├── integration/
│   │   │   └── test_api.py
│   │   └── e2e/
│   │       └── test_workflow_creation.py
│   │
│   └── scripts/                      # Utility scripts
│       ├── start_dev.sh
│       └── migrate_db.py
│
├── temporal/                          # ⚙️ Temporal Workflows & Activities
│   ├── README.md
│   ├── requirements.txt
│   │
│   ├── workflows/                    # Workflow definitions
│   │   ├── __init__.py
│   │   ├── visual_workflow.py       # Dynamic visual workflow
│   │   └── templates/               # Workflow templates
│   │       ├── __init__.py
│   │       ├── email_escalation.py
│   │       └── document_processing.py
│   │
│   ├── activities/                   # Activity implementations
│   │   ├── __init__.py
│   │   ├── email/
│   │   │   ├── __init__.py
│   │   │   ├── gmail_actions.py
│   │   │   └── send_email.py
│   │   ├── documents/
│   │   │   ├── __init__.py
│   │   │   ├── extraction.py
│   │   │   └── parsing.py
│   │   ├── logic/
│   │   │   ├── __init__.py
│   │   │   ├── conditionals.py
│   │   │   └── timers.py
│   │   └── integrations/
│   │       ├── __init__.py
│   │       └── database.py
│   │
│   ├── workers/                      # Temporal workers
│   │   ├── __init__.py
│   │   ├── main_worker.py           # Main worker
│   │   └── email_worker.py          # Specialized workers
│   │
│   ├── shared/                       # Shared utilities
│   │   ├── __init__.py
│   │   ├── action_catalog.py        # Centralized action definitions
│   │   └── constants.py
│   │
│   └── tests/
│       ├── test_workflows.py
│       └── test_activities.py
│
├── frontend/                          # ⚛️ Next.js Frontend
│   ├── README.md
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   │
│   ├── public/                       # Static assets
│   │   ├── images/
│   │   └── fonts/
│   │
│   ├── src/
│   │   ├── app/                     # Next.js 15 App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── globals.css
│   │   │   ├── ai-builder/         # AI Workflow Builder
│   │   │   │   └── page.tsx
│   │   │   └── visual-builder/     # Visual Workflow Builder
│   │   │       └── page.tsx
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── workflow/           # Workflow-specific components
│   │   │   │   ├── AIWorkflowBuilder.tsx
│   │   │   │   ├── VisualBuilder.tsx
│   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   └── StepCard.tsx
│   │   │   └── templates/          # Template cards
│   │   │       └── TemplateGallery.tsx
│   │   │
│   │   ├── lib/                    # Utilities & configs
│   │   │   ├── api/               # API client
│   │   │   │   ├── client.ts
│   │   │   │   ├── workflows.ts
│   │   │   │   └── agent.ts
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   │   ├── useWorkflow.ts
│   │   │   │   └── useAgent.ts
│   │   │   ├── utils/             # Helper functions
│   │   │   │   ├── validation.ts
│   │   │   │   └── formatting.ts
│   │   │   ├── constants/         # Constants
│   │   │   │   └── actions.ts
│   │   │   └── types/             # TypeScript types
│   │   │       ├── workflow.ts
│   │   │       └── api.ts
│   │   │
│   │   └── styles/                # Additional styles
│   │       └── components.css
│   │
│   └── tests/
│       ├── unit/
│       └── e2e/
│
├── infrastructure/                    # 🏗️ Infrastructure as Code
│   ├── README.md
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── frontend.Dockerfile
│   │   └── temporal-worker.Dockerfile
│   ├── kubernetes/
│   │   ├── backend/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   ├── frontend/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   └── temporal/
│   │       └── worker-deployment.yaml
│   └── terraform/                    # Optional: Terraform configs
│       └── main.tf
│
├── scripts/                          # 🔧 Utility Scripts
│   ├── setup.sh                     # Initial setup
│   ├── dev.sh                       # Start dev environment
│   ├── test.sh                      # Run all tests
│   ├── lint.sh                      # Run linters
│   └── deploy.sh                    # Deployment script
│
└── config/                           # ⚙️ Configuration Files
    ├── redis.conf
    ├── nginx.conf
    └── logging.yaml
```

---

## 🎯 KEY IMPROVEMENTS

### 1. **Separation of Concerns**
- ✅ Backend API separate from Temporal orchestration
- ✅ Frontend completely isolated
- ✅ Infrastructure and deployment configs in dedicated folder
- ✅ Documentation centralized

### 2. **Clear Module Boundaries**
- ✅ `backend/` - FastAPI, agents, API endpoints
- ✅ `temporal/` - Workflows, activities, workers
- ✅ `frontend/` - Next.js UI components
- ✅ `infrastructure/` - Docker, K8s, deployment

### 3. **Best Practices**
- ✅ Each module has its own README
- ✅ Tests co-located with code
- ✅ Shared utilities in dedicated folders
- ✅ Environment configs (.env.example)
- ✅ CI/CD ready structure

### 4. **Scalability**
- ✅ Easy to add new activities/workflows
- ✅ Easy to add new API endpoints
- ✅ Easy to add new UI components
- ✅ Microservice-ready architecture

---

## 📋 MIGRATION PLAN

### Phase 1: Create New Structure (1-2 hours)
```bash
# Create all directories
mkdir -p backend/{app/{api/v1,core,agents/{tools,prompts},models,utils},tests/{unit,integration,e2e},scripts}
mkdir -p temporal/{workflows/templates,activities/{email,documents,logic,integrations},workers,shared,tests}
mkdir -p frontend/src/{app,components/{ui,workflow,templates},lib/{api,hooks,utils,constants,types},styles}
mkdir -p docs/{architecture,api,guides,audits}
mkdir -p infrastructure/{docker,kubernetes/{backend,frontend,temporal},terraform}
mkdir -p scripts config
```

### Phase 2: Move Backend Files (2-3 hours)
```bash
# Move API
mv examples/visual_workflow_builder/backend/api.py backend/app/main.py
mv examples/visual_workflow_builder/backend/session_store.py backend/app/core/

# Move agents
mv src/agents/workflow_creation_agent.py backend/app/agents/workflow_agent.py

# Extract tools from agent into separate files
# (Manual refactoring needed)
```

### Phase 3: Move Temporal Files (2-3 hours)
```bash
# Move workflows
mv dynamic_workflow.py temporal/workflows/visual_workflow.py

# Move activities
mv src/activities/fourkites_actions.py temporal/activities/
mv src/activities/gmail_inbox_actions.py temporal/activities/email/gmail_actions.py

# Move workers
mv workers/fourkites_real_worker.py temporal/workers/main_worker.py
```

### Phase 4: Move Frontend Files (2-3 hours)
```bash
# Move Next.js app
mv workflow-builder-fe/* frontend/

# Reorganize components
mv workflow-builder-fe/components/FourKitesWorkflowBuilderV2.tsx frontend/src/components/workflow/AIWorkflowBuilder.tsx
mv workflow-builder-fe/components/ErrorBoundary.tsx frontend/src/components/ui/
```

### Phase 5: Update Imports & Configs (2-3 hours)
- Update all Python imports to new paths
- Update TypeScript imports
- Update docker-compose.yml
- Update package.json references
- Update environment configs

### Phase 6: Testing & Validation (2-3 hours)
- Run backend tests
- Run frontend tests
- Test Temporal workflows
- End-to-end testing

---

## 🚀 QUICK START (After Migration)

```bash
# 1. Clone repository
git clone <repo-url>
cd fourkites-workflow-builder

# 2. Setup environment
./scripts/setup.sh

# 3. Start development
make dev

# 4. Access services
# Backend API: http://localhost:8001
# Frontend: http://localhost:3000
# Temporal UI: http://localhost:8233
```

---

## 📦 MAKEFILE COMMANDS

```makefile
.PHONY: help dev prod test lint clean

help:
	@echo "FourKites Workflow Builder - Available Commands"
	@echo "  make dev     - Start development environment"
	@echo "  make prod    - Start production environment"
	@echo "  make test    - Run all tests"
	@echo "  make lint    - Run linters"
	@echo "  make clean   - Clean build artifacts"

dev:
	docker-compose -f docker-compose.dev.yml up

prod:
	docker-compose -f docker-compose.prod.yml up -d

test:
	./scripts/test.sh

lint:
	./scripts/lint.sh

clean:
	rm -rf backend/.pytest_cache
	rm -rf frontend/.next
	find . -type d -name __pycache__ -exec rm -rf {} +
```

---

## 📝 MODULE README TEMPLATES

### Backend README
```markdown
# Backend API

FastAPI backend for FourKites Workflow Builder.

## Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

## Run
```bash
uvicorn app.main:app --reload --port 8001
```

## Test
```bash
pytest
```
```

### Temporal README
```markdown
# Temporal Workflows & Activities

Workflow orchestration using Temporal.io

## Start Worker
```bash
cd temporal
python workers/main_worker.py
```

## Test Workflows
```bash
pytest tests/
```
```

### Frontend README
```markdown
# Frontend

Next.js 15 frontend with React Flow visualization.

## Setup
```bash
cd frontend
npm install
cp .env.example .env.local
```

## Run
```bash
npm run dev
```

## Build
```bash
npm run build
```
```

---

## 🎯 BENEFITS OF NEW STRUCTURE

### For Developers
- ✅ Easy to find files
- ✅ Clear module boundaries
- ✅ Consistent naming conventions
- ✅ Self-documenting structure

### For DevOps
- ✅ Docker-ready structure
- ✅ K8s-ready structure
- ✅ Easy to deploy modules independently
- ✅ Clear service boundaries

### For New Team Members
- ✅ Quick onboarding
- ✅ Clear documentation
- ✅ Easy to understand architecture
- ✅ Consistent patterns

---

## ⚠️ MIGRATION NOTES

1. **Backup First**: Create backup before migration
2. **Incremental Migration**: Migrate module by module
3. **Test Each Phase**: Test after each migration phase
4. **Update CI/CD**: Update CI/CD pipelines after migration
5. **Update Documentation**: Update all docs with new paths

---

## 📊 BEFORE vs AFTER

### BEFORE (Current - Cluttered)
```
temporal-project/
├── src/
├── examples/
├── workers/
├── workflow-builder-fe/
├── test_*.py (scattered)
├── run_*.py (scattered)
└── (40+ background processes cluttering the repo)
```

### AFTER (Clean)
```
fourkites-workflow-builder/
├── backend/         # Clean API
├── temporal/        # Clean workflows
├── frontend/        # Clean UI
├── infrastructure/  # Clean deployment
└── docs/           # Clean documentation
```

---

**Estimated Total Migration Time**: 12-18 hours
**Recommended**: Do it incrementally over 2-3 days
**Priority**: HIGH - Will significantly improve maintainability

---

**Next Steps**:
1. Review and approve structure
2. Create backup
3. Start Phase 1 (create directories)
4. Execute migration phase by phase
5. Test and validate
6. Update documentation
