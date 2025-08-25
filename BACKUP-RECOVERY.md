# PME2GO Backup and Recovery System

Version: 2.0.0  
Last Updated: August 2025

## Overview

The PME2GO application includes a comprehensive backup and recovery system designed to protect against data loss and ensure business continuity. The system provides automated scheduled backups, manual backup operations, and reliable recovery procedures.

## Features

### Automated Backup Scheduling
- **Full Backups**: Daily at 2:00 AM (configurable)
- **Incremental Backups**: Every 6 hours (configurable)
- **Cleanup**: Weekly on Sunday at 3:00 AM (configurable)

### Backup Types
- **Full Backup**: Complete database dump, application data, system info, and logs
- **Incremental Backup**: Only changes since last backup, optimized for storage

### Data Protection
- **Database**: PostgreSQL dump using pg_dump
- **Application Data**: Configuration, statistics, environment info
- **System Info**: Platform details, Node.js version, environment variables
- **Logs**: Application logs with configurable retention

### Storage Features
- **Compression**: Automatic tar.gz compression with configurable levels
- **Retention**: Automatic cleanup of old backups (default: 30 days)
- **Integrity**: Backup manifests with checksums for verification
- **Organization**: Separate directories for full and incremental backups

## Installation and Setup

### Prerequisites
- PostgreSQL with pg_dump utility
- Node.js v14+ with npm
- Sufficient disk space for backups (recommend 10GB+)

### Dependencies
The backup system requires the following npm packages:
```bash
npm install node-cron archiver winston winston-daily-rotate-file
```

### Environment Configuration
Set these environment variables for custom configuration:

```bash
# Backup Configuration
BACKUP_DIR=./backups                          # Backup directory path
BACKUP_RETENTION_DAYS=30                      # Days to retain backups
BACKUP_COMPRESSION_LEVEL=6                    # Compression level (1-9)

# Schedule Configuration (cron format)
FULL_BACKUP_SCHEDULE="0 2 * * *"             # Daily at 2 AM
INCREMENTAL_BACKUP_SCHEDULE="0 */6 * * *"    # Every 6 hours
CLEANUP_SCHEDULE="0 3 * * 0"                 # Weekly Sunday at 3 AM

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Postgres2024!
```

## Usage

### Command Line Interface

The backup system provides a comprehensive CLI for management:

```bash
# Create a full backup manually
node backup-manager.js full

# Create an incremental backup manually
node backup-manager.js incremental

# List all available backups
node backup-manager.js list

# Show backup service status
node backup-manager.js status

# Clean up old backups manually
node backup-manager.js cleanup

# Run backup system tests
node backup-manager.js test

# Start the backup scheduler (runs continuously)
node backup-manager.js start-scheduler
```

### Restore Operations

```bash
# Restore from a specific backup
node backup-manager.js restore --backup ./backups/full/backup.tar.gz

# Restore including logs
node backup-manager.js restore --backup ./backups/full/backup.tar.gz --restore-logs true
```

### Programmatic Usage

```javascript
const BackupService = require('./backup-service');

// Initialize backup service
const backupService = new BackupService({
  backupDir: './backups',
  retentionDays: 30
});

await backupService.initialize();

// Create full backup
const fullResult = await backupService.createFullBackup();
console.log('Backup created:', fullResult.backupPath);

// Create incremental backup
const incResult = await backupService.createIncrementalBackup();
console.log('Incremental backup:', incResult.backupPath);

// List backups
const backups = await backupService.listBackups();
console.log('Available backups:', backups.length);

// Cleanup
await backupService.shutdown();
```

## Backup Structure

### Full Backup Contents
```
full_backup_2025-08-24T14-30-00-000Z.tar.gz
├── database_full_2025-08-24T14-30-00-001Z.sql     # PostgreSQL dump
├── application_data_1234567890.json               # App configuration
├── system_info_1234567890.json                    # System information
├── logs_backup_1234567890.tar.gz                  # Application logs
└── manifest.json                                  # Backup metadata
```

### Incremental Backup Contents
```
incremental_backup_2025-08-24T20-30-00-000Z.tar.gz
├── database_incremental_2025-08-24T20-30-00-001Z.sql  # Changed data only
├── recent_logs_1234567890.tar.gz                      # Recent logs
└── manifest.json                                      # Backup metadata
```

### Backup Manifest
Each backup includes a manifest file with metadata:
```json
{
  "type": "full",
  "timestamp": "2025-08-24T14:30:00.000Z",
  "version": "1.0",
  "files": {
    "database": "database_full_2025-08-24T14-30-00-001Z.sql",
    "applicationData": "application_data_1234567890.json",
    "systemInfo": "system_info_1234567890.json",
    "logs": "logs_backup_1234567890.tar.gz"
  },
  "metadata": {
    "databaseSize": "15 MB",
    "nodeVersion": "v18.17.0",
    "platform": "win32",
    "trigger": "scheduled"
  },
  "checksums": {
    "database": "sha256:abc123...",
    "applicationData": "sha256:def456...",
    "systemInfo": "sha256:ghi789...",
    "logs": "sha256:jkl012..."
  }
}
```

## Monitoring and Logging

### Winston Integration
All backup operations are logged using Winston with structured JSON format:

```json
{
  "service": "pme2go-api",
  "version": "2.0.0",
  "environment": "production",
  "context": "SERVER",
  "level": "info",
  "message": "Full backup completed successfully",
  "timestamp": "2025-08-24 14:30:15.123",
  "backupName": "full_backup_2025-08-24T14-30-00-000Z",
  "duration": "2134ms",
  "size": "0.15MB"
}
```

### Log Files
- `combined-YYYY-MM-DD.log`: All backup operations
- `error-YYYY-MM-DD.log`: Backup errors only
- `admin-YYYY-MM-DD.log`: Administrative actions

### Health Monitoring
Check backup service health:
```bash
node backup-manager.js status
```

Output includes:
- Configuration status
- Scheduled job status
- Recent backup summary
- Disk space usage

## Recovery Procedures

### Database Restoration
1. Stop the application server
2. Backup current database (if recoverable)
3. Run the restore command
4. Verify data integrity
5. Restart application services

```bash
# Example recovery procedure
systemctl stop pme2go-api
node backup-manager.js restore --backup ./backups/full/latest_backup.tar.gz
systemctl start pme2go-api
```

### Partial Recovery
To restore only specific components:
1. Extract the backup manually
2. Use individual SQL files or data files
3. Selectively restore components

### Point-in-Time Recovery
Combine full and incremental backups:
1. Restore the most recent full backup
2. Apply incremental backups chronologically
3. Restore to desired point in time

## Best Practices

### Storage Management
- Monitor backup directory disk space regularly
- Store backups on separate physical drives
- Consider off-site backup storage for critical data
- Test backup compression settings for optimal size/speed balance

### Security Considerations
- Encrypt backup files for sensitive data
- Secure backup directory permissions (chmod 700)
- Rotate backup encryption keys regularly
- Store database passwords securely

### Performance Optimization
- Schedule full backups during low-traffic hours
- Adjust incremental backup frequency based on data change rate
- Use SSD storage for backup operations
- Monitor backup duration and optimize as needed

### Testing and Validation
- Perform regular restore tests (monthly recommended)
- Validate backup integrity using manifest checksums
- Test recovery procedures in staging environment
- Document recovery time objectives (RTO) and recovery point objectives (RPO)

## Troubleshooting

### Common Issues

#### pg_dump Not Found
```bash
# Windows: Add PostgreSQL bin directory to PATH
set PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin

# Linux/Mac: Install postgresql-client
sudo apt-get install postgresql-client-15
```

#### Permission Denied
```bash
# Check directory permissions
ls -la ./backups

# Fix permissions
chmod 755 ./backups
chown -R $(whoami) ./backups
```

#### Database Connection Failed
```bash
# Test connection manually
psql -h localhost -U postgres -d postgres -c "SELECT version();"

# Check environment variables
echo $DB_HOST $DB_PORT $DB_USER
```

#### Backup Size Issues
```bash
# Check disk space
df -h ./backups

# Clean up old backups manually
node backup-manager.js cleanup

# Adjust retention period
export BACKUP_RETENTION_DAYS=7
```

### Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| ENOENT | Directory not found | Create backup directory |
| EACCES | Permission denied | Check file/directory permissions |
| ENOSPC | No space left | Free up disk space or change backup location |
| CONN_ERR | Database connection failed | Verify database credentials and connectivity |
| PG_DUMP_ERR | pg_dump failed | Check PostgreSQL installation and PATH |

### Log Analysis
```bash
# Check recent backup errors
tail -f ./logs/error-$(date +%Y-%m-%d).log

# Search for specific backup issues
grep "backup failed" ./logs/combined-*.log

# Monitor backup performance
grep "duration" ./logs/combined-*.log | tail -10
```

## API Integration

### Admin Endpoints
The backup system can be controlled via REST API:

```javascript
// Get backup status
GET /api/admin/system/backups/status

// List backups
GET /api/admin/system/backups

// Create manual backup
POST /api/admin/system/backups/create
{
  "type": "full",
  "compress": true
}

// Restore from backup
POST /api/admin/system/backups/restore
{
  "backupPath": "./backups/full/backup.tar.gz",
  "includeLogs": false
}
```

### WebSocket Notifications
Real-time backup status via WebSocket:
```javascript
// Backup started
{
  "type": "backup_started",
  "backupType": "full",
  "timestamp": "2025-08-24T14:30:00.000Z"
}

// Backup completed
{
  "type": "backup_completed",
  "backupType": "full",
  "backupPath": "./backups/full/backup.tar.gz",
  "duration": 2134,
  "size": 157286400
}

// Backup failed
{
  "type": "backup_failed",
  "backupType": "incremental",
  "error": "Database connection failed",
  "timestamp": "2025-08-24T14:30:00.000Z"
}
```

## Production Deployment

### Docker Integration
```dockerfile
# Add backup volumes in docker-compose.yml
volumes:
  - ./backups:/app/backups
  - ./logs:/app/logs

# Environment configuration
environment:
  - BACKUP_DIR=/app/backups
  - BACKUP_RETENTION_DAYS=30
```

### Kubernetes Deployment
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pme2go-api
spec:
  template:
    spec:
      containers:
      - name: api
        volumeMounts:
        - name: backup-storage
          mountPath: /app/backups
      volumes:
      - name: backup-storage
        persistentVolumeClaim:
          claimName: backup-pvc
```

### System Service Integration
```bash
# Create systemd service for backup scheduler
sudo tee /etc/systemd/system/pme2go-backup.service > /dev/null <<EOF
[Unit]
Description=PME2GO Backup Service
After=network.target postgresql.service

[Service]
Type=simple
User=pme2go
WorkingDirectory=/opt/pme2go/server
ExecStart=/usr/bin/node backup-manager.js start-scheduler
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pme2go-backup
sudo systemctl start pme2go-backup
```

## Support and Maintenance

### Version History
- v2.0.0: Initial comprehensive backup system
- v2.0.1: Added incremental backup support
- v2.0.2: Improved compression and manifest system
- v2.0.3: Added API integration and monitoring

### Contributing
When contributing to the backup system:
1. Test backup and restore procedures thoroughly
2. Update documentation for any configuration changes
3. Add appropriate logging and error handling
4. Consider backward compatibility for backup formats

### Support Contacts
- Technical Issues: Create issue at GitHub repository
- Security Concerns: Send email to security team
- Feature Requests: Submit feature request via GitHub

---

**Last Updated:** August 2025  
**Version:** 2.0.0  
**Documentation Version:** 1.0.0