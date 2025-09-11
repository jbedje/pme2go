#!/bin/sh

# PME2GO Production Startup Script

set -e

echo "🚀 Starting PME2GO Production Server..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations if needed
echo "🔄 Running database migrations..."
node server/migrate.js

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the API server in the background
echo "🖥️  Starting API server on port $SERVER_PORT..."
node server/index.js &
API_PID=$!

# Start the WebSocket server in the background
echo "🔌 Starting WebSocket server on port $WEBSOCKET_PORT..."
node server/websocket-server.js &
WS_PID=$!

# Start the frontend server (serve static files)
echo "🌐 Starting frontend server on port $PORT..."
npx serve -s build -l $PORT &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
  echo "🛑 Shutting down servers..."
  kill $API_PID $WS_PID $FRONTEND_PID 2>/dev/null
  wait
  echo "✅ Graceful shutdown complete"
  exit 0
}

# Handle signals
trap shutdown SIGTERM SIGINT

# Wait for any process to exit
wait