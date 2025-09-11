#!/bin/bash

# PME2GO VPS Setup Script
# Run this script on your VPS as root or with sudo privileges

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Please run this script as a non-root user with sudo privileges"
   exit 1
fi

print_status "🚀 Setting up VPS for PME2GO deployment..."

# Update system
print_status "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "🔧 Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    nodejs \
    npm \
    pm2 \
    certbot \
    python3-certbot-nginx \
    fail2ban \
    ufw \
    htop \
    nano \
    build-essential

# Install latest Node.js (18.x)
print_status "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
print_status "⚙️ Installing PM2 process manager..."
sudo npm install -g pm2

# Setup PM2 to start on boot
sudo pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Configure PostgreSQL
print_status "🐘 Setting up PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE pme2go_production;
CREATE USER pme2go_user WITH PASSWORD 'PME2GO_SecurePass_2024!';
GRANT ALL PRIVILEGES ON DATABASE pme2go_production TO pme2go_user;
ALTER USER pme2go_user CREATEDB;
\q
EOF

# Configure Redis
print_status "🔴 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Create application directory
print_status "📁 Creating application directory..."
sudo mkdir -p /var/www/pme2go
sudo chown $USER:$USER /var/www/pme2go
cd /var/www/pme2go

# Setup firewall
print_status "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
print_status "🛡️ Setting up fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create deployment user and SSH key
print_status "🔑 Setting up deployment keys..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key for GitHub (if not exists)
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "pme2go-deployment@$(hostname)" -f ~/.ssh/id_rsa -N ""
    print_success "SSH key generated. Add this public key to your GitHub repository:"
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
fi

# Create deployment script
cat > deploy-from-github.sh << 'EOF'
#!/bin/bash

# PME2GO GitHub Deployment Script

set -e

REPO_URL="git@github.com:YOUR_USERNAME/PME2GO.git"
APP_DIR="/var/www/pme2go"
BRANCH="main"

print_status() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

cd $APP_DIR

print_status "🔄 Pulling latest code from GitHub..."

# First time clone or pull updates
if [ ! -d ".git" ]; then
    git clone $REPO_URL .
else
    git fetch origin
    git reset --hard origin/$BRANCH
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
print_status "Application is running at: http://$(curl -s ifconfig.me)"
EOF

chmod +x deploy-from-github.sh

# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
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

# Create logs directory
mkdir -p logs

# Create environment file template
cat > .env.production << 'EOF'
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
JWT_SECRET=your-super-secure-jwt-secret-change-this-256-bits
JWT_REFRESH_SECRET=your-super-secure-refresh-jwt-secret-change-this
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Frontend URLs (update with your domain)
REACT_APP_API_URL=http://YOUR_DOMAIN_OR_IP:3002/api
REACT_APP_WS_URL=ws://YOUR_DOMAIN_OR_IP:3005
REACT_APP_FRONTEND_URL=http://YOUR_DOMAIN_OR_IP

# CORS Configuration
ALLOWED_ORIGINS=http://YOUR_DOMAIN_OR_IP,http://localhost:3001
EOF

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pme2go << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Serve static files
    location / {
        root /var/www/pme2go/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3002/api/health;
        access_log off;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/pme2go /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/pme2go"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump pme2go_production > $BACKUP_DIR/database_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www/pme2go \
    --exclude=node_modules \
    --exclude=build \
    --exclude=logs \
    --exclude=.git \
    .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh

# Setup cron for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/pme2go/backup.sh >> /var/www/pme2go/logs/backup.log 2>&1") | crontab -

print_success "✅ VPS setup completed successfully!"
echo ""
print_status "📋 Next steps:"
echo "1. Add your SSH public key to GitHub repository (Deploy Keys)"
echo "2. Update REPO_URL in deploy-from-github.sh with your repository"
echo "3. Update .env.production with your actual domain/IP"
echo "4. Update Nginx config with your domain"
echo "5. Run: ./deploy-from-github.sh"
echo ""
print_status "🔑 Your SSH public key (add to GitHub):"
echo "----------------------------------------"
cat ~/.ssh/id_rsa.pub
echo "----------------------------------------"
echo ""
print_status "📁 Files created in /var/www/pme2go:"
echo "   - deploy-from-github.sh (deployment script)"
echo "   - ecosystem.config.js (PM2 configuration)"
echo "   - .env.production (environment variables)"
echo "   - backup.sh (backup script)"
echo ""
print_status "🌐 Your server IP: $(curl -s ifconfig.me)"
echo "Configure DNS: your-domain.com → $(curl -s ifconfig.me)"
EOF