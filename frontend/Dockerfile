# ═══════════════════════════════════════════════════
# PRISM Frontend - Docker Build & Production Runtime
# ═══════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3001/api/v1
ARG VITE_SOCKET_URL=http://localhost:3001

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine AS runtime
WORKDIR /app

# Install simple HTTP server
RUN npm install -g serve

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built app from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to app user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1);});req.on('error', () => process.exit(1));"

CMD ["serve", "-s", "dist", "-l", "3000"]

# Expose port
EXPOSE 3000
