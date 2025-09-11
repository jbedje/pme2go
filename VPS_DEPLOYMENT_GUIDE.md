# 🚀 PME2GO VPS Deployment Guide via GitHub

This guide will help you deploy PME2GO to your VPS with automatic deployment from GitHub.

## 📋 Prerequisites

- **VPS Server** (Ubuntu 20.04+ recommended)
- **GitHub Repository** with your PME2GO code
- **Domain Name** (optional, can use IP address)
- **SSH Access** to your VPS

## 🎯 Quick Start (5 Minutes)

### 1. Setup Your VPS

```bash
# On your VPS, run as non-root user with sudo privileges
wget https://raw.githubusercontent.com/YOUR_USERNAME/PME2GO/main/deploy-scripts/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

This script will:
- Install Node.js, PostgreSQL, Redis, Nginx, PM2
- Configure database and firewall
- Generate SSH keys for GitHub
- Create deployment scripts
- Setup automatic backups

### 2. Configure GitHub Repository

**Add Deploy Key to GitHub:**
1. Copy the SSH public key shown after setup
2. Go to your GitHub repo → Settings → Deploy keys
3. Add new deploy key, paste the public key, enable write access

**Update Repository URL:**
```bash
# On your VPS
cd /var/www/pme2go
nano deploy-from-github.sh
# Change: REPO_URL="git@github.com:YOUR_USERNAME/PME2GO.git"
```

### 3. Configure Environment

```bash
# On your VPS
cd /var/www/pme2go
nano .env.production
```

**Update these values:**
```env
# Replace YOUR_DOMAIN_OR_IP with your actual domain or IP
REACT_APP_API_URL=http://YOUR_DOMAIN_OR_IP/api
REACT_APP_WS_URL=ws://YOUR_DOMAIN_OR_IP/ws
REACT_APP_FRONTEND_URL=http://YOUR_DOMAIN_OR_IP

# Update CORS origins
ALLOWED_ORIGINS=http://YOUR_DOMAIN_OR_IP

# Generate secure JWT secrets (32+ characters)
JWT_SECRET=your-super-secure-jwt-secret-change-this-256-bits
JWT_REFRESH_SECRET=your-super-secure-refresh-jwt-secret-change-this
```

### 4. Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/pme2go
# Replace YOUR_DOMAIN_OR_IP with your domain or IP
sudo systemctl reload nginx
```

### 5. Deploy!

```bash
cd /var/www/pme2go
./deploy-from-github.sh
```

## 🔄 Automatic Deployment Options

Choose one of these methods for automatic deployment:

### Option A: GitHub Actions (Recommended)

**Setup GitHub Secrets:**
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VPS_HOST` - Your VPS IP address
   - `VPS_USER` - Your VPS username
   - `VPS_SSH_KEY` - Your private SSH key (from VPS ~/.ssh/id_rsa)
   - `VPS_PORT` - SSH port (usually 22)

**How it works:**
- Every push to `main` branch triggers deployment
- GitHub Actions runs tests first
- If tests pass, it deploys to your VPS
- Includes automatic health checks

### Option B: GitHub Webhooks

**Setup Webhook Server:**
```bash
cd /var/www/pme2go
./deploy-scripts/setup-github-webhook.sh
pm2 start webhook.ecosystem.config.js
```

**Add Webhook to GitHub:**
1. Go to your repo → Settings → Webhooks
2. Add webhook:
   - URL: `http://YOUR_IP:9000/webhook`
   - Content type: `application/json`
   - Secret: `your-webhook-secret-change-this`
   - Events: Just the push event

## 📊 Managing Your Application

### Check Status
```bash
# Application status
pm2 status

# View logs
pm2 logs pme2go-api
pm2 logs pme2go-websocket

# Restart services
pm2 restart all

# Monitor resources
pm2 monit
```

### Manual Deployment
```bash
cd /var/www/pme2go
./deploy-from-github.sh
```

### Database Management
```bash
# Access PostgreSQL
sudo -u postgres psql pme2go_production

# Create backup
./backup.sh

# View recent backups
ls -la /var/backups/pme2go/
```

### Nginx Management
```bash
# Check configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔒 SSL Certificate Setup (Optional but Recommended)

### Using Let's Encrypt (Free)
```bash
# Install certbot (already done in setup script)
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Update Environment for HTTPS
```bash
nano .env.production
```

```env
# Change HTTP to HTTPS
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WS_URL=wss://your-domain.com/ws
REACT_APP_FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
```

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs pme2go-api --lines 50

# Check system resources
htop
df -h

# Restart application
pm2 restart pme2go-api
```

### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql pme2go_production -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Restart nginx
sudo systemctl restart nginx
```

### GitHub Deployment Issues
```bash
# Check SSH key
ssh -T git@github.com

# Test manual clone
git clone git@github.com:YOUR_USERNAME/PME2GO.git test-clone

# Check webhook logs (if using webhooks)
pm2 logs pme2go-webhook
```

## 📈 Performance Optimization

### PM2 Clustering
```bash
# Edit ecosystem.config.js to use more instances
nano ecosystem.config.js
# Change: instances: 'max' or specific number

# Apply changes
pm2 reload ecosystem.config.js
```

### Database Optimization
```bash
# Connect to database
sudo -u postgres psql pme2go_production

# Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

### Nginx Caching
```bash
# Edit nginx config to add caching
sudo nano /etc/nginx/sites-available/pme2go

# Add caching headers for API responses
location /api {
    # ... existing config ...
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 💰 Cost Estimation

**VPS Requirements:**
- **Minimum**: 1GB RAM, 1 CPU, 25GB SSD (~$5-10/month)
- **Recommended**: 2GB RAM, 1 CPU, 50GB SSD (~$10-20/month)
- **High Traffic**: 4GB RAM, 2 CPU, 80GB SSD (~$20-40/month)

**Popular VPS Providers:**
- DigitalOcean: Starting at $6/month
- Vultr: Starting at $6/month
- Linode: Starting at $5/month
- Hetzner: Starting at €4.15/month

## ✅ Deployment Checklist

- [ ] VPS setup completed
- [ ] GitHub deploy key added
- [ ] Environment variables configured
- [ ] Nginx configuration updated
- [ ] Database created and configured
- [ ] Initial deployment successful
- [ ] Health check returns 200 OK
- [ ] Demo users can log in
- [ ] WebSocket connection working
- [ ] Automatic deployment configured
- [ ] SSL certificate installed (optional)
- [ ] Monitoring and backups working

## 📞 Support

**Common Commands Reference:**
```bash
# Application Management
pm2 status                    # Check app status
pm2 logs pme2go-api          # View API logs
pm2 restart all              # Restart all services
./deploy-from-github.sh      # Manual deployment

# System Management
sudo systemctl status nginx # Nginx status
sudo systemctl status postgresql # Database status
htop                        # System resources
df -h                       # Disk usage

# Database
sudo -u postgres psql pme2go_production  # Access database
./backup.sh                              # Create backup

# Logs
tail -f logs/api.log        # Application logs
sudo tail -f /var/log/nginx/access.log  # Web server logs
```

---

🎉 **Congratulations!** Your PME2GO application is now running on your VPS with automatic GitHub deployment!

**Access your application:**
- **Frontend**: http://YOUR_DOMAIN_OR_IP
- **API Health**: http://YOUR_DOMAIN_OR_IP/api/health
- **Admin Panel**: Login with admin credentials

**Next steps:**
1. Set up monitoring (optional)
2. Configure custom domain
3. Set up SSL certificate
4. Monitor performance and scale as needed