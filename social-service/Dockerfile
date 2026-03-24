# ── Build stage ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage ────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema & config, then regenerate client for production
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3334

CMD ["sh", "-c", "npx prisma db push && node dist/src/main"]