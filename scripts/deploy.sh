#!/bin/bash

# PME2GO Production Deployment Script
# This script handles the complete deployment process for PME2GO

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DEPLOY_LOG="${PROJECT_ROOT}/logs/deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$DEPLOY_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$DEPLOY_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$DEPLOY_LOG"
}

check_requirements() {
    log "Checking deployment requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check required files
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        error "Production environment file (.env.production) not found. Please create it from .env.production template."
    fi
    
    if [[ ! -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        error "Production Docker Compose file not found."
    fi
    
    success "All requirements satisfied"
}

create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$PROJECT_ROOT"/{logs,backups,uploads,data,ssl}
    mkdir -p "$PROJECT_ROOT"/database/{init,backups}
    mkdir -p "$PROJECT_ROOT"/nginx/{conf.d}
    mkdir -p "$PROJECT_ROOT"/monitoring/{prometheus,grafana/dashboards,grafana/datasources}
    
    success "Directories created"
}

backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps | grep -q "Up"; then
        BACKUP_NAME="deployment_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
        
        # Backup database
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres pg_dump -U postgres pme2go > "$BACKUP_DIR/$BACKUP_NAME/database.sql" || warning "Database backup failed"
        
        # Backup volumes
        docker run --rm -v pme2go_postgres_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v pme2go_redis_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        
        success "Backup created: $BACKUP_NAME"
    else
        log "No running deployment found, skipping backup"
    fi
}

build_and_deploy() {
    log "Building and deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build application
    docker-compose -f docker-compose.prod.yml build --no-cache api
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    success "Application deployed successfully"
}

wait_for_services() {
    log "Waiting for services to be ready..."
    
    # Wait for database
    timeout=60
    while ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres pg_isready -U postgres -d pme2go; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            error "Database failed to start within 60 seconds"
        fi
    done
    
    # Wait for API
    timeout=60
    while ! curl -sf http://localhost:3004/api/health > /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            error "API failed to start within 60 seconds"
        fi
    done
    
    success "All services are ready"
}

run_database_migrations() {
    log "Running database migrations..."
    
    # Run migrations if they exist
    if [[ -f "$PROJECT_ROOT/database/migrations.sql" ]]; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres psql -U postgres -d pme2go -f /docker-entrypoint-initdb.d/migrations.sql
        success "Database migrations completed"
    else
        log "No migrations found, skipping"
    fi
}

verify_deployment() {
    log "Verifying deployment..."
    
    # Check services status
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps | grep -q "Up"; then
        error "Some services are not running"
    fi
    
    # Check API health
    if ! curl -sf http://localhost:3004/api/health | jq -e '.status == "healthy"' > /dev/null; then
        error "API health check failed"
    fi
    
    # Check database connection
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres psql -U postgres -d pme2go -c "SELECT 1;" > /dev/null; then
        error "Database connection failed"
    fi
    
    success "Deployment verification successful"
}

cleanup_old_images() {
    log "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old application images (keep last 3)
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | \
    grep pme2go | \
    tail -n +4 | \
    awk '{print $3}' | \
    xargs -r docker rmi
    
    success "Cleanup completed"
}

show_status() {
    echo
    echo -e "${GREEN}=== PME2GO Deployment Status ===${NC}"
    echo
    
    # Services status
    echo -e "${BLUE}Services:${NC}"
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
    echo
    
    # Useful URLs
    echo -e "${BLUE}Application URLs:${NC}"
    echo "  API Health: http://localhost:3004/api/health"
    echo "  Admin Dashboard: http://localhost:3004/api/admin/performance/dashboard"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3000"
    echo
    
    # Resource usage
    echo -e "${BLUE}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo
}

# Main deployment process
main() {
    log "Starting PME2GO deployment..."
    echo
    
    check_requirements
    create_directories
    backup_current_deployment
    build_and_deploy
    wait_for_services
    run_database_migrations
    verify_deployment
    cleanup_old_images
    
    success "Deployment completed successfully!"
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        log "Rolling back to previous deployment..."
        # Implement rollback logic here
        warning "Rollback functionality not implemented yet"
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" logs -f
        ;;
    "stop")
        log "Stopping services..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down
        success "Services stopped"
        ;;
    "restart")
        log "Restarting services..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" restart
        success "Services restarted"
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|logs|stop|restart}"
        echo
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Show deployment status"
        echo "  logs     - Show application logs"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        exit 1
        ;;
esac