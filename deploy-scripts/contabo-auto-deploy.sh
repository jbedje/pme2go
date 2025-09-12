#!/bin/bash

# PME2GO Automated Deployment Script for Contabo VPS
# Domain: lab.cipme.ci
# Hostname: vmi2804403.contaboserver.net

set -e

echo "🚀 PME2GO Automated Deployment Starting..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get user input for configuration
echo ""
print_status "Please provide the following information:"
read -p "Database password for PME user (minimum 12 characters): " DB_PASSWORD
read -p "JWT Secret (minimum 32 characters): " JWT_SECRET
read -p "Your email for SSL certificate: " SSL_EMAIL

# Validate inputs
if [[ ${#DB_PASSWORD} -lt 12 ]]; then
    print_error "Database password must be at least 12 characters long"
    exit 1
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
    print_error "JWT secret must be at least 32 characters long"
    exit 1
fi

if [[ ! "$SSL_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    print_error "Please provide a valid email address"
    exit 1
fi

print_success "Configuration validated. Starting deployment..."

# Step 1: Update system
print_status "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Step 2: Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw software-properties-common
print_success "Packages installed"

# Step 3: Install Node.js 18
print_status "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
npm install -g pm2 serve
print_success "Node.js and PM2 installed"

# Step 4: Configure PostgreSQL
print_status "Configuring PostgreSQL database..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE \"pme-360-db\";" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER pmeuser WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"pme-360-db\" TO pmeuser;"
sudo -u postgres psql -c "ALTER USER pmeuser CREATEDB;"
print_success "Database configured"

# Step 5: Setup application directory
print_status "Setting up application..."
mkdir -p /var/www
cd /var/www

# Remove existing directory if it exists
if [ -d "pme2go" ]; then
    print_warning "Removing existing pme2go directory..."
    rm -rf pme2go
fi

# Clone repository
git clone https://github.com/jbedje/pme2go.git
cd pme2go

# Install dependencies
npm install
print_success "Dependencies installed"

# Step 6: Create environment file
print_status "Creating production environment file..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3001
SERVER_PORT=3002

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pme-360-db
DB_USER=pmeuser
DB_PASSWORD=$DB_PASSWORD

# Security
JWT_SECRET=$JWT_SECRET
BCRYPT_ROUNDS=12

# App Configuration
APP_NAME=PME2GO
APP_URL=https://lab.cipme.ci
CORS_ORIGIN=https://lab.cipme.ci
EOF
print_success "Environment file created"

# Step 7: Run database migration
print_status "Running database migration..."
npm run migrate
print_success "Database migration completed"

# Step 8: Build application
print_status "Building React application..."
npm run build
print_success "Application built"

# Step 9: Create PM2 logs directory
mkdir -p /var/log/pm2

# Step 10: Start applications with PM2
print_status "Starting applications with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
print_success "Applications started with PM2"

# Step 11: Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/pme2go << 'EOF'
server {
    listen 80;
    server_name lab.cipme.ci vmi2804403.contaboserver.net;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3001;
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

    # API routes
    location /api/ {
        proxy_pass http://localhost:3002/api/;
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

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/pme2go /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
systemctl restart nginx
systemctl enable nginx
print_success "Nginx configured"

# Step 12: Configure firewall
print_status "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
print_success "Firewall configured"

# Step 13: Setup SSL certificate
print_status "Setting up SSL certificate..."
certbot --nginx -d lab.cipme.ci --email $SSL_EMAIL --agree-tos --non-interactive --redirect
print_success "SSL certificate installed"

# Step 14: Setup log rotation for PM2
print_status "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
print_success "Log rotation configured"

# Step 15: Create deployment script for future updates
print_status "Creating deployment script..."
cat > /var/www/pme2go/deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/pme2go
echo "🚀 Starting deployment..."
git pull origin main
npm install
npm run migrate
npm run build
pm2 restart ecosystem.config.js
systemctl reload nginx
echo "✅ Deployment completed successfully!"
EOF

chmod +x /var/www/pme2go/deploy.sh
print_success "Deployment script created"

# Step 16: Create monitoring script
cat > /var/www/pme2go/status.sh << 'EOF'
#!/bin/bash
echo "=== PME2GO Application Status ==="
echo ""
echo "🔧 PM2 Processes:"
pm2 status
echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager -l
echo ""
echo "🗄️ Database Status:"
sudo -u postgres psql -d "pme-360-db" -c "SELECT current_database(), current_user;" 2>/dev/null || echo "Database connection failed"
echo ""
echo "🔥 Application URLs:"
echo "Frontend: https://lab.cipme.ci"
echo "API Health: https://lab.cipme.ci/api/health"
echo ""
echo "📊 System Resources:"
free -h
df -h /
EOF

chmod +x /var/www/pme2go/status.sh

# Final status check
print_status "Running final system check..."
sleep 5

echo ""
echo "=========================================="
print_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
echo "=========================================="
echo ""
echo "📋 Deployment Summary:"
echo "   • Application URL: https://lab.cipme.ci"
echo "   • API Health Check: https://lab.cipme.ci/api/health"
echo "   • SSL Certificate: ✅ Installed"
echo "   • Database: ✅ Configured"
echo "   • PM2 Processes: ✅ Running"
echo "   • Nginx: ✅ Running"
echo "   • Firewall: ✅ Configured"
echo ""
echo "🛠️ Management Commands:"
echo "   • Check status: /var/www/pme2go/status.sh"
echo "   • Deploy updates: /var/www/pme2go/deploy.sh"
echo "   • View logs: pm2 logs"
echo "   • Restart apps: pm2 restart all"
echo ""
echo "⚠️ Important Notes:"
echo "   1. Update your DNS: lab.cipme.ci → $(curl -s http://checkip.amazonaws.com/)"
echo "   2. SSL certificate will auto-renew"
echo "   3. Database credentials are in .env.production"
echo ""

# Run status check
print_status "Current system status:"
/var/www/pme2go/status.sh

print_success "Deployment script completed! 🚀"