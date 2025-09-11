# PME2GO Production Deployment Guide

## 🚀 Quick Deployment Checklist

### Prerequisites
- [ ] Production server with Ubuntu 20.04+ or similar
- [ ] Domain name with DNS configured
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] PostgreSQL database (cloud or self-hosted)
- [ ] Redis instance (optional but recommended)

### 1. Server Setup

```bash
# On your production server
curl -fsSL https://raw.githubusercontent.com/yourusername/pme2go/main/deploy-scripts/setup-server.sh -o setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Clone Application

```bash
cd /opt/pme2go
git clone https://github.com/yourusername/pme2go.git .
```

### 3. Configure Environment

```bash
# Copy and edit environment file
cp .env.production.template .env.production
nano .env.production
```

**Required environment variables:**
```bash
# Update these values for your production environment
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_FRONTEND_URL=https://yourdomain.com
DB_HOST=your-postgres-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-256-bit-secret
```

### 4. Configure Domain

```bash
# Update nginx configuration
nano nginx/nginx.conf
# Replace 'yourdomain.com' with your actual domain
```

### 5. Generate SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Deploy Application

```bash
# Build and deploy
./deploy.sh
```

## 🔧 Detailed Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | ✅ | `production` |
| `PORT` | Frontend port | ✅ | `3001` |
| `SERVER_PORT` | API server port | ✅ | `3002` |
| `WEBSOCKET_PORT` | WebSocket port | ✅ | `3005` |
| `DB_HOST` | Database host | ✅ | `localhost` |
| `DB_NAME` | Database name | ✅ | `pme2go_production` |
| `DB_USER` | Database user | ✅ | `pme2go_user` |
| `DB_PASSWORD` | Database password | ✅ | `secure_password` |
| `JWT_SECRET` | JWT signing secret | ✅ | `256-bit-secret` |
| `REDIS_URL` | Redis connection URL | ⚠️ | `redis://localhost:6379` |
| `SMTP_HOST` | Email SMTP host | ❌ | `smtp.gmail.com` |

### Database Setup

#### Option 1: Managed Database (Recommended)
- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **DigitalOcean Managed Database**

#### Option 2: Self-hosted
```bash
# The Docker Compose includes PostgreSQL
# Data is persisted in Docker volumes
```

### SSL Configuration

#### Let's Encrypt (Recommended)
```bash
sudo certbot --nginx -d yourdomain.com
```

#### Custom Certificate
```bash
# Place your certificates in nginx/ssl/
# - fullchain.pem
# - privkey.pem
# - dhparam.pem (generate with: openssl dhparam -out dhparam.pem 2048)
```

## 📊 Monitoring & Maintenance

### Health Checks
- **Application**: `https://yourdomain.com/api/health`
- **Database**: Automatic via Docker health checks
- **Logs**: `/opt/pme2go/logs/pme2go.log`

### Backup Strategy
```bash
# Automated daily backups (already configured)
# Manual backup
./backup-script.sh
```

### Log Management
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f pme2go_app

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# View database logs
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Updates & Maintenance
```bash
# Update application
git pull origin main
./deploy.sh

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Database backup before updates
./backup-script.sh
```

## 🚦 CI/CD Pipeline

### GitHub Actions Setup
1. **Fork the repository**
2. **Configure secrets** in GitHub repository settings:
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub password
   - `PROD_HOST` - Production server IP
   - `PROD_USER` - SSH user
   - `PROD_SSH_KEY` - SSH private key
   - `DB_HOST`, `DB_PASSWORD`, etc. - Production environment variables

3. **Push to main branch** triggers automatic deployment

### Manual Deployment
```bash
# On production server
cd /opt/pme2go
git pull origin main
./deploy.sh
```

## 🔒 Security Checklist

- [ ] SSL certificate configured and auto-renewing
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Strong passwords for database and Redis
- [ ] JWT secrets are cryptographically secure
- [ ] fail2ban configured for SSH protection
- [ ] Regular security updates enabled
- [ ] Database backups automated
- [ ] Application logs monitored

## 🆘 Troubleshooting

### Common Issues

#### 1. Application won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs pme2go_app

# Check health
curl http://localhost:3002/api/health
```

#### 2. Database connection issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U pme2go_user -d pme2go_production -c "SELECT 1;"
```

#### 3. SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

#### 4. High memory usage
```bash
# Check system resources
htop

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Support Commands

```bash
# View system status
docker-compose -f docker-compose.prod.yml ps

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale if needed (not typically required)
docker-compose -f docker-compose.prod.yml up -d --scale pme2go_app=2

# Database console access
docker-compose -f docker-compose.prod.yml exec postgres psql -U pme2go_user -d pme2go_production

# Application console access
docker-compose -f docker-compose.prod.yml exec pme2go_app bash
```

## 📈 Performance Optimization

### Monitoring Metrics
- Response times via `/metrics` endpoint
- Database connection pool usage
- Memory and CPU utilization
- WebSocket connection counts

### Scaling Options
1. **Vertical Scaling**: Increase server resources
2. **Horizontal Scaling**: Add more application instances
3. **Database Scaling**: Use read replicas
4. **CDN**: Use CloudFlare or similar for static assets

## 📞 Support

For deployment issues:
1. Check the logs first
2. Review this documentation
3. Check GitHub Issues
4. Contact support at: support@pme2go.com

---

**🎉 Congratulations! Your PME2GO application is now running in production!**

Visit your domain to see the live application: https://yourdomain.com