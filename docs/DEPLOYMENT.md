# FourKites Workflow Builder - Deployment Guide

## Table of Contents
- [Service Ports Reference](#service-ports-reference)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Azure Deployment](#azure-deployment)
- [Jenkins CI/CD](#jenkins-cicd)
- [Production Checklist](#production-checklist)

---

## Service Ports Reference

All services use the following ports by default:

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | 3000 | http://localhost:3000 | Next.js web application |
| **Backend API** | 8001 | http://localhost:8001 | FastAPI backend server |
| **Backend API Docs** | 8001 | http://localhost:8001/docs | Swagger API documentation |
| **Temporal Server** | 7233 | localhost:7233 | Temporal gRPC endpoint |
| **Temporal UI** | 8233 | http://localhost:8233 | Temporal web interface for monitoring workflows |
| **Redis** | 6379 | localhost:6379 | Session storage |
| **PostgreSQL** | 5432 | localhost:5432 | Database for Temporal |

---

## Environment Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **Docker & Docker Compose** (for containerized deployment)
- **Git**
- **AWS CLI** (for AWS deployment)
- **Azure CLI** (for Azure deployment)

### 1. Clone Repository

```bash
git clone https://github.com/fk-mspraja/FK_Visual_Workflow_Builder.git
cd FK_Visual_Workflow_Builder
```

### 2. Configure Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit .env files with your credentials
```

**Required Environment Variables:**

```bash
# .env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
TEMPORAL_HOST=localhost:7233
```

---

## Local Development

### Option 1: Using Makefile (Recommended)

```bash
# Install all dependencies
make setup

# Start all services (backend, frontend, temporal, redis)
make dev

# Run tests
make test

# Clean build artifacts
make clean
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Temporal Worker

```bash
cd temporal
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python workers/fourkites_worker.py
```

### Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Temporal UI**: http://localhost:8233

---

## Docker Deployment

### Local Docker Compose

```bash
# Navigate to docker directory
cd infrastructure/docker

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Build Individual Images

```bash
# Backend
docker build -t fourkites-backend:latest -f infrastructure/docker/backend.Dockerfile .

# Frontend
docker build -t fourkites-frontend:latest -f infrastructure/docker/frontend.Dockerfile .

# Temporal Worker
docker build -t fourkites-temporal-worker:latest -f infrastructure/docker/temporal.Dockerfile .
```

---

## AWS Deployment

### Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. ECR repositories created
4. ECS cluster set up

### 1. Configure AWS Credentials

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
```

### 2. Create Infrastructure

#### Create ECR Repositories

```bash
aws ecr create-repository --repository-name fourkites-backend
aws ecr create-repository --repository-name fourkites-frontend
aws ecr create-repository --repository-name fourkites-temporal-worker
```

#### Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name fourkites-workflow-production
```

#### Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id fourkites-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

### 3. Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag fourkites-backend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/fourkites-backend:latest
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/fourkites-backend:latest

# Repeat for frontend and temporal-worker
```

### 4. Create ECS Services

Create task definitions for each service (backend, frontend, temporal-worker) and create services in your ECS cluster.

Reference configurations are in `infrastructure/kubernetes/` (can be adapted for ECS).

---

## Azure Deployment

### Prerequisites

1. Azure subscription
2. Azure CLI installed
3. Azure Container Registry (ACR) created
4. AKS cluster set up

### 1. Login to Azure

```bash
az login
az account set --subscription <your-subscription-id>
```

### 2. Create Resource Group

```bash
az group create \
  --name fourkites-workflow-rg \
  --location eastus
```

### 3. Create Azure Container Registry

```bash
az acr create \
  --resource-group fourkites-workflow-rg \
  --name fourkitesregistry \
  --sku Basic

# Login to ACR
az acr login --name fourkitesregistry
```

### 4. Create AKS Cluster

```bash
az aks create \
  --resource-group fourkites-workflow-rg \
  --name fourkites-workflow-aks \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --attach-acr fourkitesregistry

# Get credentials
az aks get-credentials \
  --resource-group fourkites-workflow-rg \
  --name fourkites-workflow-aks
```

### 5. Create Azure Cache for Redis

```bash
az redis create \
  --resource-group fourkites-workflow-rg \
  --name fourkites-redis \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

### 6. Push Images to ACR

```bash
# Tag and push
docker tag fourkites-backend:latest fourkitesregistry.azurecr.io/fourkites-backend:latest
docker push fourkitesregistry.azurecr.io/fourkites-backend:latest

# Repeat for frontend and temporal-worker
```

### 7. Deploy to AKS

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/backend/
kubectl apply -f infrastructure/kubernetes/frontend/
kubectl apply -f infrastructure/kubernetes/temporal/

# Check deployment status
kubectl get pods
kubectl get services
```

---

## Jenkins CI/CD

### Prerequisites

1. Jenkins server with Docker support
2. Jenkins credentials configured:
   - `aws-region` (AWS region)
   - `aws-ecr-registry` (ECR registry URL)
   - `azure-container-registry` (ACR name)
   - `azure-credentials` (Service Principal credentials)

### 1. Configure Jenkins Pipeline

The `Jenkinsfile` in the root directory defines the CI/CD pipeline.

**Pipeline Parameters:**
- `DEPLOYMENT_TARGET`: Choose AWS or AZURE
- `ENVIRONMENT`: dev, staging, or production
- `DOCKER_REGISTRY`: Optional custom registry URL

### 2. Create Jenkins Job

1. Create new **Pipeline** job
2. Configure **Git** source: https://github.com/fk-mspraja/FK_Visual_Workflow_Builder.git
3. Set **Pipeline script path**: `Jenkinsfile`
4. Enable **Build with Parameters**

### 3. Pipeline Stages

The pipeline includes:
1. **Checkout** - Clone repository
2. **Install Dependencies** - Python & Node.js
3. **Run Tests** - Backend and frontend tests
4. **Build Docker Images** - All services
5. **Push to Registry** - AWS ECR or Azure ACR
6. **Deploy** - ECS or AKS
7. **Health Check** - Verify deployment

### 4. Trigger Build

```bash
# Manual trigger from Jenkins UI
# Or via webhook from GitHub
```

---

## Production Checklist

### Security

- [ ] All secrets stored in environment variables or secrets manager
- [ ] `.env` files excluded from git (check `.gitignore`)
- [ ] API keys rotated regularly
- [ ] HTTPS/TLS enabled for all services
- [ ] Network security groups configured
- [ ] IAM roles/policies configured with least privilege

### Infrastructure

- [ ] Redis configured with persistence
- [ ] Database backups enabled
- [ ] Load balancers configured
- [ ] Auto-scaling policies set
- [ ] Health checks configured for all services
- [ ] Logging and monitoring enabled (CloudWatch/Azure Monitor)

### Application

- [ ] All ports correctly configured
- [ ] CORS settings reviewed
- [ ] Rate limiting enabled
- [ ] Session timeout configured
- [ ] Error tracking configured (Sentry, etc.)

### Testing

- [ ] All tests passing
- [ ] Load testing completed
- [ ] Security scanning completed
- [ ] Smoke tests on production

### Documentation

- [ ] Environment variables documented
- [ ] API documentation up to date
- [ ] Deployment runbook created
- [ ] Rollback procedures documented

---

## Troubleshooting

### Port Conflicts

If you encounter port conflicts:

```bash
# Check what's using a port
lsof -ti:8001  # Replace with your port

# Kill the process
kill -9 <PID>
```

### Temporal Connection Issues

```bash
# Verify Temporal server is running
docker ps | grep temporal

# Check Temporal UI
curl http://localhost:8233
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis logs
docker logs fourkites-redis
```

### Import Errors (Backend)

If you see `ModuleNotFoundError`:

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Support

For deployment issues, contact:
- DevOps Team: devops@fourkites.com
- Slack Channel: #workflow-builder-deployment

---

**Version**: 1.0.0
**Last Updated**: October 2025
