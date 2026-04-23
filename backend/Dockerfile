# syntax=docker/dockerfile:1

# -----------------------------
# Stage 1: Dependencies
# -----------------------------
FROM node:22-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# -----------------------------
# Stage 2: Builder
# -----------------------------
FROM node:22-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the NestJS application
RUN pnpm run build

# -----------------------------
# Stage 3: Production
# -----------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install pnpm (needed for prisma generate if we do it at runtime, or just copy generated client)
RUN npm install -g pnpm@10

# Copy built application and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client for this architecture (in case builder arch differs)
RUN pnpm prisma generate

EXPOSE 3001

CMD ["node", "dist/main"]
