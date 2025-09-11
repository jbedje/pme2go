#!/bin/sh

# PME2GO Railway Startup Script

set -e

echo "🚀 Starting PME2GO on Railway..."

# Use Railway's provided PORT or default to 3002
export SERVER_PORT=${PORT:-3002}
export WEBSOCKET_PORT=${WS_PORT:-3005}

# Railway provides DATABASE_URL for PostgreSQL
if [ ! -z "$DATABASE_URL" ]; then
    echo "✅ Database URL detected from Railway"
    # Parse DATABASE_URL if needed
    export DB_URL=$DATABASE_URL
fi

# Wait for database to be ready (if DATABASE_URL is provided)
if [ ! -z "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database connection..."
    
    # Extract database details from URL for connection test
    # DATABASE_URL format: postgres://user:password@host:port/database
    
    # Simple connection test
    until nc -z $(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/') $(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/') 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    
    echo "✅ Database is ready!"
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    node server/production-migrate.js || echo "⚠️ Migration skipped (may be first deployment)"
else
    echo "⚠️ No database URL provided, running in demo mode"
fi

# Create logs directory
mkdir -p logs

echo "🖥️ Starting application server on port $SERVER_PORT..."

# For Railway, we run both the API server and serve the frontend
# We'll use the production server that serves static files
node server/production-server.js