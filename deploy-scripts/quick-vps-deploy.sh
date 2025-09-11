#!/bin/bash

# PME2GO Quick VPS Deployment Script
# Run this after the initial VPS setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the PME2GO directory."
    exit 1
fi

print_status "🚀 Starting PME2GO VPS deployment..."

# Get user input for configuration
read -p "Enter your VPS IP address or domain: " VPS_HOST
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter your repository name (default: PME2GO): " REPO_NAME
REPO_NAME=${REPO_NAME:-PME2GO}

print_status "📝 Configuration:"
echo "   VPS: $VPS_HOST"
echo "   Repository: https://github.com/$GITHUB_USER/$REPO_NAME"

# Update environment file
print_status "⚙️ Updating environment configuration..."
cat > .env.production << EOF
# PME2GO Production Environment
NODE_ENV=production
PORT=3001
SERVER_PORT=3002
WEBSOCKET_PORT=3005

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pme2go_production
DB_USER=pme2go_user
DB_PASSWORD=PME2GO_SecurePass_2024!
DB_SSL=false

# Security Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Frontend URLs
REACT_APP_API_URL=http://$VPS_HOST/api
REACT_APP_WS_URL=ws://$VPS_HOST/ws
REACT_APP_FRONTEND_URL=http://$VPS_HOST

# CORS Configuration
ALLOWED_ORIGINS=http://$VPS_HOST,https://$VPS_HOST
EOF

# Update deployment script
print_status "🔧 Updating deployment script..."
cat > deploy-from-github.sh << EOF
#!/bin/bash

# PME2GO GitHub Deployment Script

set -e

REPO_URL="git@github.com:$GITHUB_USER/$REPO_NAME.git"
APP_DIR="/var/www/pme2go"
BRANCH="main"

print_status() { echo -e "\033[0;34m[INFO]\033[0m \$1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m \$1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m \$1"; }

cd \$APP_DIR

print_status "🔄 Pulling latest code from GitHub..."

# First time clone or pull updates
if [ ! -d ".git" ]; then
    git clone \$REPO_URL .
else
    git fetch origin
    git reset --hard origin/\$BRANCH
fi

print_status "📦 Installing dependencies..."
npm ci --only=production

print_status "🏗️ Building application..."
npm run build

print_status "🔄 Running database migrations..."
node server/production-migrate.js || echo "Migration completed or already up to date"

print_status "🔄 Restarting application with PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

print_status "🧹 Cleaning up..."
npm prune --production

print_success "🎉 Deployment completed successfully!"
print_status "Application is running at: http://$VPS_HOST"
EOF

chmod +x deploy-from-github.sh

# Update PM2 ecosystem
print_status "🔧 Updating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'pme2go-api',
      script: 'server/production-server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SERVER_PORT: 3002,
        WEBSOCKET_PORT: 3005
      },
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      log_file: 'logs/api.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'pme2go-websocket',
      script: 'server/websocket-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 3005
      },
      error_file: 'logs/ws-error.log',
      out_file: 'logs/ws-out.log',
      log_file: 'logs/ws.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
}
EOF

# Create nginx configuration
print_status "🌐 Creating Nginx configuration..."
cat > nginx-pme2go.conf << EOF
server {
    listen 80;
    server_name $VPS_HOST;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Serve static files
    location / {
        root /var/www/pme2go/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3002/api/health;
        access_log off;
    }
}
EOF

print_success "✅ Configuration files updated successfully!"
echo ""
print_status "📋 Next steps:"
echo "1. Commit and push these changes to GitHub:"
echo "   git add ."
echo "   git commit -m 'Configure for VPS deployment'"
echo "   git push origin main"
echo ""
echo "2. On your VPS, copy this nginx config:"
echo "   sudo cp /var/www/pme2go/nginx-pme2go.conf /etc/nginx/sites-available/pme2go"
echo "   sudo ln -sf /etc/nginx/sites-available/pme2go /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "3. Deploy the application:"
echo "   cd /var/www/pme2go"
echo "   ./deploy-from-github.sh"
echo ""
print_status "🌐 Your application will be available at: http://$VPS_HOST"
print_status "🔍 Health check: http://$VPS_HOST/api/health"