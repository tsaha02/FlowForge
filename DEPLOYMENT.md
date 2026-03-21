# FlowForge Deployment Guide 🚀

This guide explains how to deploy FlowForge to production environments.

## 🏁 Prerequisites

### 1. External Services
- **PostgreSQL**: Managed database (Supabase, RDS, etc.)
- **Redis**: For BullMQ and execution queues (Upstash, ElastiCache, etc.)
- **SMTP Server**: (Optional) For email notifications.
- **Socket.IO Host**: (Optional) For high-concurrency log streaming.

### 2. Environment Variables
Ensure the following variables are set in your production host:

**Backend (`packages/server/.env`)**
```text
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_aes_256_key
PORT=4000
```

**Frontend (`packages/web/.env.production`)**
```text
NEXT_PUBLIC_API_URL=https://api.flowforge.app
NEXT_PUBLIC_SOCKET_URL=https://api.flowforge.app
```

---

## 🏗 Deployment Strategy

### Option A: Docker Compose (Easiest)
FlowForge includes a `docker-compose.yml` for simplified deployment.

1. Configure your `.env`.
2. Run:
```bash
docker-compose up -d --build
```

### Option B: Cloud Platforms (Vercel + Railway/Render)
- **Frontend**: Deploy `packages/web` to **Vercel**.
- **Backend**: Deploy `packages/server` to **Railway** or **Render**.

---

## 🛠 Production Build
Run these locally or in CI/CD before deploying:

**Frontend Build**
```bash
cd packages/web
npm run build
```

**Backend Build (TypeScript)**
```bash
cd packages/server
npm run build
```

---

## 📦 Database Management
Always run migrations before launching a new version:
```bash
npx prisma migrate deploy
```

## 🔒 Security Best Practices
- **JWT_SECRET**: Use a strong random string (64+ chars).
- **ENCRYPTION_KEY**: Must be a 32-byte hex string.
- **CORS**: Restrict `packages/server` to only allow your frontend domain.
