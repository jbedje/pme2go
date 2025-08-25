# PME2GO Production Deployment Guide

Version: 2.0.0  
Last Updated: August 2025

## Overview

This guide covers the complete production deployment process for the PME2GO professional networking platform, including containerized deployment with Docker, SSL/TLS configuration, monitoring, and backup automation.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Static IP address and domain name

### Required Software
- Docker 24.0+ and Docker Compose 2.0+
- Git for code deployment
- OpenSSL for certificate management
- curl and jq for API testing

```bash
# Ubuntu/Debian installation
sudo apt update
sudo apt install -y docker.io docker-compose git openssl curl jq

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```

## Quick Start Deployment

### 1. Clone and Setup Repository
```bash
git clone https://github.com/your-org/pme2go.git
cd pme2go

# Copy and configure environment
cp .env.production .env.prod
nano .env.prod  # Edit with your production values
```

### 2. Configure SSL Certificates
```bash
# For production with Let's Encrypt
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com

# For development with self-signed
./scripts/setup-ssl.sh localhost
```

### 3. Deploy Application
```bash
# Full production deployment
./scripts/deploy.sh

# Check deployment status
./scripts/deploy.sh status
```

### 4. Verify Deployment
```bash
# Test API health
curl https://api.your-domain.com/api/health

# Access admin dashboard
https://api.your-domain.com/api/admin/performance/dashboard

# Monitor with Grafana
https://your-domain.com:3000
```

## Detailed Configuration

### Environment Variables (.env.production)

```bash
# Critical Security Settings - MUST CHANGE
JWT_SECRET=your-256-bit-secret-key-here
DB_PASSWORD=your-secure-database-password
REDIS_PASSWORD=your-redis-password

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pme2go
DB_USER=postgres

# Application URLs
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://api.your-domain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@your-domain.com

# Performance & Security
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=10mb
BCRYPT_ROUNDS=12
```

### Docker Compose Services

The production deployment includes:
- **API Server**: Node.js application with Express
- **PostgreSQL**: Primary database with connection pooling
- **Redis**: Session storage and caching
- **Nginx**: Reverse proxy with SSL termination
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Performance dashboards and alerting

### SSL/TLS Configuration

#### Let's Encrypt (Production)
```bash
# Automatic certificate generation
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com

# Certificates auto-renew via cron job
crontab -l  # Check renewal schedule
```

#### Self-Signed (Development)
```bash
./scripts/setup-ssl.sh localhost
```

## Database Setup

### Production Database Initialization
```bash
# Initialize production database with security
docker-compose exec postgres psql -U postgres -d pme2go -f /docker-entrypoint-initdb.d/init-production.sql

# Create database users
docker-compose exec postgres psql -U postgres -c "
CREATE USER pme2go_api WITH ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE pme2go TO pme2go_api;
"
```

### Database Migration
```bash
# Run migrations
docker-compose exec api node server/run-migrations.js

# Verify schema
docker-compose exec postgres psql -U postgres -d pme2go -c "\\dt"
```

## Monitoring and Logging

### Performance Dashboard
Access the comprehensive performance dashboard at:
- **URL**: `https://api.your-domain.com/api/admin/performance/dashboard`
- **Features**: Real-time metrics, system health, error tracking
- **Auto-refresh**: Every 30 seconds

### Grafana Monitoring
- **URL**: `https://your-domain.com:3000`
- **Login**: admin / (password from .env.production)
- **Pre-configured dashboards**: API performance, database metrics, system resources

### Log Management
```bash
# View application logs
docker-compose logs -f api

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f nginx

# Log files location
tail -f logs/combined-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
```

## Backup and Recovery

### Automated Backup Setup
```bash
# Create full backup
./scripts/backup-prod.sh full

# Database only backup
./scripts/backup-prod.sh database-only

# Setup automated daily backups
crontab -e
# Add: 0 2 * * * /path/to/pme2go/scripts/backup-prod.sh full
```

### Backup Features
- **Full Backup**: Database, uploads, logs, configuration
- **Incremental Backup**: Changed data only (scheduled every 6 hours)
- **Retention**: 30 days by default (configurable)
- **Compression**: gzip compression for space efficiency
- **Verification**: Automatic backup integrity checks
- **Cloud Storage**: Optional S3 upload support

### Recovery Process
```bash
# List available backups
ls -la backups/production/

# Restore from specific backup
docker-compose down
./scripts/restore-backup.sh backups/production/database_20250824_020000.sql.gz
docker-compose up -d
```

## Security Configuration

### Network Security
```bash
# Configure firewall (UFW example)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3004/tcp  # Block direct API access
```

### Application Security
- **JWT**: 256-bit secret with 24-hour expiration
- **Passwords**: bcrypt with 12 rounds
- **HTTPS**: TLS 1.2/1.3 with secure ciphers
- **Rate Limiting**: API endpoint protection
- **CSRF**: Cross-site request forgery protection
- **Helmet**: Security headers middleware

### Database Security
- **Encryption**: PostgreSQL with encrypted passwords
- **User Separation**: Dedicated users for API, monitoring, backup
- **Connection Limits**: Maximum 200 concurrent connections
- **SSL**: Required for all connections
- **Audit Logging**: Connection and query logging enabled

## Performance Optimization

### Database Optimization
```sql
-- Performance settings (applied automatically)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
```

### Application Optimization
- **Connection Pooling**: PostgreSQL connection pooling
- **Caching**: Redis for session and query caching  
- **Compression**: Gzip compression for all responses
- **Static Files**: Nginx serving with long-term caching
- **CDN Ready**: Headers configured for CDN integration

### Monitoring Metrics
- **Response Times**: Average, 95th, 99th percentiles
- **Error Rates**: 4xx and 5xx error tracking
- **Database Performance**: Query execution times, connection pool
- **System Resources**: CPU, memory, disk I/O
- **Business Metrics**: User registrations, active sessions

## Deployment Commands Reference

### Basic Operations
```bash
# Deploy application
./scripts/deploy.sh

# Show deployment status  
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs

# Stop services
./scripts/deploy.sh stop

# Restart services
./scripts/deploy.sh restart
```

### Maintenance Operations
```bash
# Create backup
./scripts/backup-prod.sh full

# Setup SSL certificates
./scripts/setup-ssl.sh your-domain.com admin@domain.com

# Update application (zero-downtime)
git pull origin main
./scripts/deploy.sh

# Database maintenance
docker-compose exec postgres vacuumdb -U postgres -d pme2go -z
```

## Troubleshooting

### Common Issues

#### SSL Certificate Problems
```bash
# Check certificate validity
openssl x509 -in ssl/pme2go.crt -text -noout

# Renew Let's Encrypt certificate
./scripts/setup-ssl.sh your-domain.com admin@domain.com

# Test SSL configuration
curl -I https://api.your-domain.com/api/health
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Test connection
docker-compose exec postgres psql -U postgres -d pme2go -c "SELECT version();"

# Check database logs
docker-compose logs postgres
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check slow queries
docker-compose exec postgres psql -U postgres -d pme2go -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;"

# View performance dashboard
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://api.your-domain.com/api/admin/performance/report
```

#### Application Errors
```bash
# Check application logs
docker-compose logs -f api

# Check specific error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Test API health
curl https://api.your-domain.com/api/health
```

### Service Management

#### Health Checks
```bash
# API health check
curl https://api.your-domain.com/api/health

# Database health
docker-compose exec postgres pg_isready -U postgres

# Redis health  
docker-compose exec redis redis-cli ping
```

#### Log Analysis
```bash
# Search error logs
grep -i error logs/combined-*.log

# Monitor real-time logs
tail -f logs/combined-$(date +%Y-%m-%d).log | jq '.'

# Performance analysis
grep "duration" logs/combined-*.log | tail -20
```

## Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database credentials secured
- [ ] Firewall rules configured
- [ ] Backup storage configured
- [ ] Monitoring alerts configured

### Post-Deployment
- [ ] API health check passes
- [ ] Database connection successful
- [ ] SSL certificate valid
- [ ] Performance dashboard accessible
- [ ] Backup system tested
- [ ] Monitoring alerts configured
- [ ] Load testing completed

### Security Audit
- [ ] JWT secret is secure (256-bit)
- [ ] Database passwords encrypted
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Access logs monitoring
- [ ] Regular security updates scheduled

## Support and Maintenance

### Regular Maintenance Tasks
- **Daily**: Monitor logs and performance metrics
- **Weekly**: Review backup integrity and system health
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and capacity planning

### Monitoring Alerts
Configure alerts for:
- API response time > 2 seconds
- Error rate > 5%
- Database connection failures
- Disk space > 80%
- Memory usage > 90%
- SSL certificate expiration (30 days)

### Update Process
```bash
# Update application
git pull origin main
./scripts/deploy.sh

# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
./scripts/deploy.sh
```

---

**Last Updated:** August 2025  
**Version:** 2.0.0  
**Support:** Create an issue in the GitHub repository for technical support.