# PME2GO API Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY server/ ./server/
COPY src/ ./src/
COPY public/ ./public/
COPY *.json *.js *.md ./

# Create necessary directories
RUN mkdir -p /app/logs /app/backups /app/uploads /app/temp

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/api/health || exit 1

# Start application
CMD ["node", "server/secure-server.js"]