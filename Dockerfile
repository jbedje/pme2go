# PME2GO Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build the React application
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build the application
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Stage 2: Setup the backend server
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Stage 3: Production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    tzdata

# Set timezone
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies from backend builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./

# Copy built frontend from frontend builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/build ./build

# Create logs directory
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads

# Create startup script
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 3002 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/api/health || exit 1

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]