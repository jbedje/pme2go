#!/bin/bash

# PME2GO Quick Deployment Script
# This script automates the entire deployment process

set -e

# Colors for output
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   exit 1
fi

# Check for required commands
check_requirements() {
    print_status "Checking requirements..."
    
    local missing_commands=()
    
    if ! command -v docker &> /dev/null; then
        missing_commands+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_commands+=("docker-compose")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_commands+=("git")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        print_status "Please run the server setup script first: ./setup-server.sh"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Validate environment file
validate_environment() {
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production file not found"
        
        if [ -f ".env.production.template" ]; then
            print_status "Copying template file..."
            cp .env.production.template .env.production
            print_warning "Please edit .env.production with your actual values before continuing"
            print_status "nano .env.production"
            read -p "Press Enter when you've finished editing the environment file..."
        else
            print_error "No environment template found. Please create .env.production"
            exit 1
        fi
    fi
    
    # Check for default values that need to be changed
    local needs_update=false
    
    if grep -q "yourdomain.com" .env.production; then
        print_warning "Domain configuration still uses placeholder values"
        needs_update=true
    fi
    
    if grep -q "CHANGE_THIS" .env.production; then
        print_warning "Environment file contains placeholder passwords"
        needs_update=true
    fi
    
    if [ "$needs_update" = true ]; then
        print_error "Please update .env.production with actual values before deploying"
        exit 1
    fi
    
    print_success "Environment configuration validated"
}

# Generate secrets if needed
generate_secrets() {
    print_status "Checking JWT secrets..."
    
    local env_file=".env.production"
    local temp_file=$(mktemp)
    
    # Generate JWT_SECRET if it contains placeholder
    if grep -q "your-super-secure-jwt-secret" "$env_file"; then
        local jwt_secret=$(openssl rand -base64 32)
        sed "s/JWT_SECRET=your-super-secure-jwt-secret.*/JWT_SECRET=$jwt_secret/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        print_success "Generated new JWT_SECRET"
    fi
    
    # Generate JWT_REFRESH_SECRET if it contains placeholder
    if grep -q "your-super-secure-refresh-jwt-secret" "$env_file"; then
        local refresh_secret=$(openssl rand -base64 32)
        sed "s/JWT_REFRESH_SECRET=your-super-secure-refresh-jwt-secret.*/JWT_REFRESH_SECRET=$refresh_secret/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        print_success "Generated new JWT_REFRESH_SECRET"
    fi
}

# Build and deploy
deploy_application() {
    print_status "Building Docker image..."
    docker build -t pme2go:latest .
    
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    print_status "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_status "Waiting for services to start..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3002/api/health &> /dev/null; then
            break
        fi
        sleep 2
        ((attempt++))
        print_status "Waiting for services... ($attempt/$max_attempts)"
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Services failed to start within expected time"
        print_status "Checking logs..."
        docker-compose -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
    
    print_success "Services started successfully"
}

# Perform health checks
health_check() {
    print_status "Performing health checks..."
    
    # Check API health
    if curl -f http://localhost:3002/api/health &> /dev/null; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        return 1
    fi
    
    # Check if database is accessible
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U pme2go_user &> /dev/null; then
        print_success "Database health check passed"
    else
        print_error "Database health check failed"
        return 1
    fi
    
    # Check Redis if configured
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis health check passed"
    else
        print_warning "Redis health check failed (this is optional)"
    fi
    
    return 0
}

# Cleanup old resources
cleanup() {
    print_status "Cleaning up old Docker resources..."
    docker system prune -f &> /dev/null || true
    print_success "Cleanup completed"
}

# Display deployment info
display_info() {
    local domain=$(grep "REACT_APP_FRONTEND_URL" .env.production | cut -d'=' -f2)
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Application Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: $domain"
    echo "   API Health: $domain/api/health"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "   Stop: docker-compose -f docker-compose.prod.yml down"
    echo ""
    echo "📁 Important files:"
    echo "   Environment: $(pwd)/.env.production"
    echo "   Logs: $(pwd)/logs/"
    echo "   Uploads: $(pwd)/uploads/"
    echo ""
}

# Main deployment process
main() {
    echo "🚀 PME2GO Production Deployment"
    echo "=================================="
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    check_requirements
    validate_environment
    generate_secrets
    deploy_application
    
    if health_check; then
        cleanup
        display_info
        
        print_success "Deployment completed successfully!"
        print_status "Your PME2GO application is now running in production."
    else
        print_error "Health checks failed. Please check the logs for details."
        print_status "View logs with: docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Handle script interruption
trap 'echo ""; print_warning "Deployment interrupted by user"; exit 1' INT

# Run main function
main "$@"