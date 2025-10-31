# Frontend

Next.js 15 frontend with AI Workflow Builder and Visual Builder.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Development

```bash
npm run dev
```

Access at: http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## Components

- **AI Workflow Builder**: `/components/workflow/AIWorkflowBuilder.tsx`
- **Visual Builder**: `/components/workflow/VisualBuilder.tsx`
- **Error Boundary**: `/components/ui/ErrorBoundary.tsx`
