# FlowForge 🚀

FlowForge is a high-performance, open-source workflow automation platform built for scale and reliability. It allows users to build complex, multi-node automation pipelines with a drag-and-drop interface, real-time execution monitoring, and powerful logical branching.

## 🌟 Features

- **Visual Workflow Editor**: Drag-and-drop React Flow canvas for building DAG-based workflows.
- **Real-time Execution Log**: Stream logs and node statuses via Socket.IO during execution.
- **Logical Branching**: Built-in Router (Switch) and Iterator (Loop) nodes for complex control flows.
- **Scheduled Triggers**: Native Cron-based scheduling via BullMQ.
- **Webhook Triggers**: unique HTTP endpoints for external integrations.
- **Execution History**: Deep forensic replay of past runs with visual status mapping.
- **Secure Credentials**: AES-256 encrypted storage for API keys and database strings.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React Flow, Zustand, Framer Motion, Lucide.
- **Backend**: Node.js, Express, Prisma (PostgreSQL).
- **Execution Engine**: BullMQ (Redis-backed), Socket.IO.
- **Styling**: Vanilla CSS, Modern Dark/Light theme.

## 📦 Project Structure

```text
/
├── packages/
│   ├── web/      # Next.js Frontend
│   └── server/   # Express API & Workflow Engine
├── docker-compose.yml
└── DEPLOYMENT.md
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL
- Redis

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` in both `packages/web` and `packages/server` and fill in your credentials.

### 4. Database Migration
```bash
cd packages/server
npx prisma migrate dev
```

### 5. Start Development
```bash
# In Root
npm run dev
```

## 📜 License
MIT
