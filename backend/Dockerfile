# ═══════════════════════════════════════════════════
# PRISM Backend - Docker Build & Production Runtime
# ═══════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=dependencies /app/node_modules ./node_modules

# Copy app code
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

# Generate Prisma client again in runtime
RUN npx prisma generate

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to app user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

# Expose ports
EXPOSE 3001
