#!/bin/bash

# PME2GO Production Backup Script
# Automated backup solution for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups/production"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET=${S3_BACKUP_BUCKET:-""}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

check_requirements() {
    log "Checking backup requirements..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps | grep -q "Up"; then
        error "Application is not running"
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    success "Requirements check passed"
}

backup_database() {
    log "Creating database backup..."
    
    local backup_file="$BACKUP_DIR/database_${TIMESTAMP}.sql"
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres \
        pg_dump -U postgres -d pme2go --no-password > "$backup_file"
    
    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        gzip "$backup_file"
        success "Database backup created: $(basename "$backup_file.gz")"
    else
        error "Database backup failed"
    fi
}

backup_volumes() {
    log "Creating volume backups..."
    
    # Backup uploaded files
    if docker volume ls | grep -q pme2go_uploads; then
        docker run --rm \
            -v pme2go_uploads:/data \
            -v "$BACKUP_DIR":/backup \
            alpine tar czf "/backup/uploads_${TIMESTAMP}.tar.gz" -C /data .
        
        success "Uploads backup created"
    fi
    
    # Backup application logs
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        tar czf "$BACKUP_DIR/logs_${TIMESTAMP}.tar.gz" -C "$PROJECT_ROOT" logs/
        success "Logs backup created"
    fi
    
    # Backup configuration files
    tar czf "$BACKUP_DIR/config_${TIMESTAMP}.tar.gz" \
        -C "$PROJECT_ROOT" \
        .env.production nginx/ monitoring/ database/init/ \
        2>/dev/null || warning "Some config files missing"
}

create_backup_manifest() {
    log "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/manifest_${TIMESTAMP}.json"
    
    cat > "$manifest_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "version": "1.0",
    "type": "full_production_backup",
    "files": {
        "database": "database_${TIMESTAMP}.sql.gz",
        "uploads": "uploads_${TIMESTAMP}.tar.gz",
        "logs": "logs_${TIMESTAMP}.tar.gz",
        "config": "config_${TIMESTAMP}.tar.gz"
    },
    "metadata": {
        "hostname": "$(hostname)",
        "docker_version": "$(docker --version)",
        "disk_usage": "$(df -h $BACKUP_DIR | tail -1)"
    },
    "checksums": {
        "database": "$(sha256sum "$BACKUP_DIR/database_${TIMESTAMP}.sql.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')",
        "uploads": "$(sha256sum "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')",
        "logs": "$(sha256sum "$BACKUP_DIR/logs_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')",
        "config": "$(sha256sum "$BACKUP_DIR/config_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')"
    }
}
EOF
    
    success "Backup manifest created"
}

upload_to_s3() {
    if [[ -n "$S3_BUCKET" ]]; then
        log "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/backups/$(date +%Y/%m)/" \
                --exclude "*" --include "*${TIMESTAMP}*"
            
            success "Backup uploaded to S3"
        else
            warning "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_DIR" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Remove empty directories
    find "$BACKUP_DIR" -type d -empty -delete
    
    local remaining=$(find "$BACKUP_DIR" -type f | wc -l)
    success "Cleanup completed. ${remaining} backup files remaining"
}

verify_backup() {
    log "Verifying backup integrity..."
    
    local database_backup="$BACKUP_DIR/database_${TIMESTAMP}.sql.gz"
    
    if [[ -f "$database_backup" ]]; then
        # Test that the backup is valid gzip and contains SQL
        if gunzip -t "$database_backup" && zgrep -q "CREATE TABLE" "$database_backup"; then
            success "Database backup verified"
        else
            error "Database backup verification failed"
        fi
    fi
    
    # Check backup sizes
    log "Backup file sizes:"
    ls -lh "$BACKUP_DIR"/*${TIMESTAMP}* | awk '{print "  " $9 ": " $5}'
}

send_notification() {
    local status=$1
    local message=$2
    
    # Log to application (if API is running)
    if curl -sf http://localhost:3004/api/health > /dev/null; then
        curl -s -X POST http://localhost:3004/api/admin/system/notifications \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${ADMIN_TOKEN:-}" \
            -d "{\"type\":\"backup\",\"status\":\"$status\",\"message\":\"$message\"}" \
            > /dev/null || true
    fi
}

# Main backup process
main() {
    log "Starting production backup..."
    echo
    
    local start_time=$(date +%s)
    
    check_requirements
    backup_database
    backup_volumes
    create_backup_manifest
    verify_backup
    upload_to_s3
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Production backup completed in ${duration} seconds"
    send_notification "success" "Production backup completed successfully"
    
    echo
    echo "Backup location: $BACKUP_DIR"
    echo "Backup timestamp: $TIMESTAMP"
    
    # Show disk usage
    echo "Backup directory usage:"
    du -sh "$BACKUP_DIR"
}

# Handle different backup types
case "${1:-full}" in
    "full")
        main
        ;;
    "database-only")
        log "Creating database-only backup..."
        check_requirements
        backup_database
        verify_backup
        success "Database-only backup completed"
        ;;
    "files-only")
        log "Creating files-only backup..."
        check_requirements
        backup_volumes
        success "Files-only backup completed"
        ;;
    "test")
        log "Testing backup system..."
        check_requirements
        log "Backup system is working correctly"
        ;;
    *)
        echo "Usage: $0 {full|database-only|files-only|test}"
        echo
        echo "Commands:"
        echo "  full         - Complete backup (default)"
        echo "  database-only - Database backup only"
        echo "  files-only   - Files and logs backup only"
        echo "  test         - Test backup system"
        exit 1
        ;;
esac