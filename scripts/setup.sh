#!/bin/bash

echo "🔧 Setting up FourKites Workflow Builder"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && pip install -r requirements.txt && cd ..

# Install temporal dependencies
echo "📦 Installing temporal dependencies..."
cd temporal && pip install -r requirements.txt && cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Create .env files
echo "📝 Creating environment files..."
[ ! -f backend/.env ] && cp backend/.env.example backend/.env 2>/dev/null || echo "ANTHROPIC_API_KEY=your_key" > backend/.env
[ ! -f frontend/.env.local ] && cp frontend/.env.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > frontend/.env.local

echo ""
echo "✅ Setup complete!"
echo "  Run: ./scripts/dev.sh to start development environment"
