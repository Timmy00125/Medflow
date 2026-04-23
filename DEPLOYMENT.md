# MedFlow Deployment Guide

## TL;DR

Deploy **frontend to Vercel** and **backend to Railway/Render/Fly.io**.  
Do NOT deploy the backend to Vercel — Socket.IO requires persistent connections that Vercel Functions cannot provide.

## Architecture

```
┌─────────────────┐         ┌──────────────────────────┐
│   Vercel        │         │   Railway / Render       │
│   (Frontend)    │◄────────┤   (Backend + Postgres)   │
│   Next.js 16    │  HTTP   │   NestJS + Socket.IO     │
└─────────────────┘         └──────────────────────────┘
```

## Why Not Vercel for the Backend?

1. **WebSockets**: Your backend uses Socket.IO (`@nestjs/platform-socket.io`). Vercel Functions are stateless and cannot maintain persistent WebSocket connections. Real-time queue updates will break.
2. **Database**: You need a running PostgreSQL instance. Vercel doesn't host Postgres for long-running backends.
3. **Process model**: NestJS is designed to run as a persistent Node.js server, not ephemeral serverless functions.

## 1. Deploy Frontend to Vercel

### Step-by-Step

1. Go to [vercel.com](https://vercel.com) and import your Git repo.
2. In project settings, set **Root Directory** to `frontend`.
3. Framework Preset should auto-detect **Next.js**.
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `https://your-backend-url.up.railway.app`
5. Click **Deploy**.

### What changed
- `frontend/vercel.json` — explicit framework declaration (optional but safe).
- `frontend/src/hooks/useSocket.ts` — now falls back to `NEXT_PUBLIC_API_URL` if `NEXT_PUBLIC_WS_URL` is not set.

## 2. Deploy Backend to Railway (Recommended)

### Prerequisites

- Railway account: [railway.app](https://railway.app)
- Code pushed to GitHub

### Steps

1. **Create PostgreSQL**
   - Dashboard → **New** → **Database** → **Add PostgreSQL**
   - Copy the `DATABASE_URL` from the **Connect** tab.

2. **Deploy the NestJS App**
   - Dashboard → **New** → **Project** → **Deploy from GitHub repo**
   - Select your repo.
   - Set **Root Directory** to `backend`.

3. **Environment Variables** (Dashboard → Variables)
   ```bash
   DATABASE_URL=postgresql://postgres:password@host:5432/telemedicine?schema=public
   JWT_SECRET=your-super-secret-jwt-key
   ENCRYPTION_KEY=your-32-char-encryption-key
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=3001
   NODE_ENV=production
   ```

4. **Build Settings**
   - **Build Command**: `npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`

5. **Generate & Run Migrations**
   - Open a Railway shell for your service.
   - Run:
     ```bash
     npx prisma migrate deploy
     npx prisma db seed
     ```

## 3. Environment Variable Summary

### Frontend (`frontend/.env.local` on Vercel)
| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `https://backend.up.railway.app` | REST API base URL |
| `NEXT_PUBLIC_WS_URL` | `https://backend.up.railway.app` | Socket.IO server URL |

### Backend (Railway/Render Dashboard)
| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | Postgres connection |
| `JWT_SECRET` | `super-secret-key` | JWT signing |
| `ENCRYPTION_KEY` | `32-char-aes-key` | PII field encryption |
| `FRONTEND_URL` | `https://frontend.vercel.app` | CORS allowlist |
| `PORT` | `3001` | Server port |

## Files Changed for Deployment

| File | Change |
|------|--------|
| `backend/src/main.ts` | CORS now reads `FRONTEND_URL` from env |
| `frontend/vercel.json` | Explicit Next.js framework config |
| `frontend/.env.example` | Documented required frontend env vars |
| `backend/.env.example` | Documented required backend env vars |
| `frontend/src/hooks/useSocket.ts` | Falls back to `NEXT_PUBLIC_API_URL` |
| `DEPLOYMENT.md` | This guide |

## Notes

- The old root `vercel.json` with `experimentalServices` has been removed. It was using an unstable Vercel API and would have failed to build.
- Do **not** commit `.env` or `.env.local` files with real secrets. Use the Vercel/Railway dashboards for production variables.
