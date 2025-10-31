# FourKites AI Workflow Builder

Enterprise-grade workflow automation platform with AI-powered conversational builder and visual flow designer.

## 🚀 Features

- **AI Workflow Builder**: Natural language workflow creation with LangGraph ReAct agent
- **Visual Builder**: Drag-and-drop workflow designer with React Flow
- **Temporal Orchestration**: Durable workflow execution with Temporal.io
- **Real Email Integration**: Gmail integration for automated communications
- **Document Processing**: AI-powered document extraction and parsing
- **Production-Ready**: Redis sessions, rate limiting, error handling, health checks

## 📁 Repository Structure

```
fourkites-workflow-builder/
├── backend/          # FastAPI backend with AI agents
├── temporal/         # Temporal workflows, activities, workers
├── frontend/         # Next.js 15 UI (AI + Visual builders)
├── docs/            # Documentation
├── infrastructure/   # Docker, K8s configs
└── scripts/         # Helper scripts
```

## 🔧 Quick Start

### 1. Setup

```bash
make setup
```

### 2. Start Development Environment

```bash
make dev
```

### 3. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/docs
- **Temporal UI**: http://localhost:8233

## 📚 Documentation

- [Architecture](docs/architecture/)
- [API Documentation](docs/api/)
- [Development Guide](docs/guides/)
- [Production Audit](docs/audits/)

## 🧪 Testing

```bash
make test
```

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - AI agent orchestration
- **Claude Sonnet 4.5** - LLM for workflow generation
- **Redis** - Session storage
- **Pydantic** - Data validation

### Temporal
- **Temporal.io** - Durable workflow engine
- **Python SDK** - Workflow/activity definitions

### Frontend
- **Next.js 15** - React framework with App Router
- **React Flow** - Visual workflow editor
- **Framer Motion** - Smooth animations
- **TailwindCSS** - Styling

## 📊 Current Status

- ✅ 95% Production Ready
- ✅ All P0/P1 critical issues resolved
- ✅ Clean, organized repository structure
- ✅ Comprehensive documentation
- ✅ Fault-tolerant architecture

## 🔐 Environment Variables

### Backend (.env)
```
ANTHROPIC_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Run linters before committing

## 📝 License

Copyright © 2025 FourKites

---

**Version**: 1.0.0
**Status**: Production Ready (95%)
