#!/bin/bash

# PME2GO Production Server Setup Script
# Run this script on your production server to set up the environment

set -e

echo "🚀 Setting up PME2GO Production Environment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    nginx \
    postgresql-client \
    redis-tools \
    htop \
    fail2ban \
    ufw

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js (for local development/testing)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/pme2go
sudo chown $USER:$USER /opt/pme2go
cd /opt/pme2go

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Setup fail2ban for SSH protection
echo "🛡️ Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create logs directory
mkdir -p logs uploads ssl

# Setup SSL directory for Let's Encrypt
sudo mkdir -p /opt/pme2go/nginx/ssl

# Install Certbot for SSL certificates
echo "🔒 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create systemd service for monitoring
echo "📊 Setting up monitoring service..."
cat > /tmp/pme2go-monitor.service << EOF
[Unit]
Description=PME2GO Health Monitor
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/docker-compose -f /opt/pme2go/docker-compose.prod.yml exec -T pme2go_app node server/health-monitor.js
User=$USER
WorkingDirectory=/opt/pme2go

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/pme2go-monitor.service /etc/systemd/system/
sudo systemctl enable pme2go-monitor.service

# Create backup script
echo "💾 Setting up backup script..."
cat > backup-script.sh << 'EOF'
#!/bin/bash

# PME2GO Backup Script
BACKUP_DIR="/opt/backups/pme2go"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "📊 Backing up database..."
docker-compose -f /opt/pme2go/docker-compose.prod.yml exec -T postgres pg_dump -U pme2go_user pme2go_production > $BACKUP_DIR/database_$DATE.sql

# Backup uploads
echo "📁 Backing up uploads..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/pme2go uploads/

# Backup environment files
echo "⚙️ Backing up configuration..."
cp /opt/pme2go/.env.production $BACKUP_DIR/env_$DATE.backup

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup-script.sh

# Setup cron job for daily backups
echo "⏰ Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/pme2go/backup-script.sh >> /opt/pme2go/logs/backup.log 2>&1") | crontab -

# Create environment template
cat > .env.production.template << 'EOF'
# PME2GO Production Environment
# Copy this file to .env.production and update the values

NODE_ENV=production
PORT=3001
SERVER_PORT=3002
WEBSOCKET_PORT=3005

# Frontend URLs
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WS_URL=wss://ws.yourdomain.com
REACT_APP_FRONTEND_URL=https://yourdomain.com

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pme2go_production
DB_USER=pme2go_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_SSL=true

# Security Configuration
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_256_BIT_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_SECURE_SECRET
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration (Optional)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
EOF

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

# PME2GO Deployment Script

set -e

echo "🚀 Starting PME2GO deployment..."

# Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
fi

# Pull latest Docker images
echo "🐳 Pulling Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "✅ Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:3002/api/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Clean up old Docker images
echo "🧹 Cleaning up..."
docker system prune -f

echo "🎉 Deployment completed successfully!"
EOF

chmod +x deploy.sh

echo ""
echo "✅ Production server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Copy .env.production.template to .env.production and update values"
echo "3. Generate SSL certificates: sudo certbot --nginx -d yourdomain.com"
echo "4. Clone your application code to /opt/pme2go"
echo "5. Run ./deploy.sh to start the application"
echo ""
echo "📁 Important files:"
echo "   - Environment: /opt/pme2go/.env.production"
echo "   - Logs: /opt/pme2go/logs/"
echo "   - Backups: /opt/backups/pme2go/"
echo "   - Deploy: /opt/pme2go/deploy.sh"
echo ""
echo "🔧 Useful commands:"
echo "   - Check status: docker-compose -f docker-compose.prod.yml ps"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "⚠️ Don't forget to:"
echo "   - Update all passwords in .env.production"
echo "   - Configure your domain in nginx.conf"
echo "   - Set up SSL certificates"
echo ""