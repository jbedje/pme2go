#!/bin/bash

# PME2GO Railway Backend Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    log "Checking Railway deployment requirements..."
    
    if ! command -v railway &> /dev/null; then
        log "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    success "Requirements check passed"
}

setup_railway_project() {
    log "Setting up Railway project..."
    
    # Login to Railway (if not already)
    railway login
    
    # Initialize Railway project
    railway init
    
    success "Railway project initialized"
}

configure_environment() {
    log "Configuring Railway environment variables..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Set environment variables
    railway variables set NODE_ENV=production
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set BCRYPT_ROUNDS=12
    railway variables set RATE_LIMIT_WINDOW=15
    railway variables set RATE_LIMIT_MAX=100
    railway variables set MAX_REQUEST_SIZE=10mb
    railway variables set LOG_LEVEL=info
    
    # Prompt for email configuration
    read -p "Enter SMTP host (e.g., smtp.gmail.com): " SMTP_HOST
    read -p "Enter SMTP port (e.g., 587): " SMTP_PORT
    read -p "Enter SMTP user: " SMTP_USER
    read -p "Enter SMTP password: " -s SMTP_PASS
    echo
    read -p "Enter from email: " FROM_EMAIL
    
    railway variables set SMTP_HOST="$SMTP_HOST"
    railway variables set SMTP_PORT="$SMTP_PORT"
    railway variables set SMTP_SECURE=false
    railway variables set SMTP_USER="$SMTP_USER"
    railway variables set SMTP_PASS="$SMTP_PASS"
    railway variables set FROM_EMAIL="$FROM_EMAIL"
    railway variables set FROM_NAME="PME2GO"
    
    success "Environment variables configured"
}

setup_database() {
    log "Setting up PostgreSQL database..."
    
    # Add PostgreSQL plugin
    railway add postgresql
    
    success "PostgreSQL database added"
}

deploy_application() {
    log "Deploying to Railway..."
    
    # Deploy
    railway up
    
    success "Deployed to Railway successfully!"
}

setup_domain() {
    log "Setting up custom domain (optional)..."
    
    # Get the Railway URL
    RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url')
    
    echo "Your Railway backend URL: $RAILWAY_URL"
    echo
    echo "To set up a custom domain:"
    echo "1. Go to Railway dashboard: https://railway.app/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > Domains"
    echo "4. Add your custom domain"
    echo
    
    # Ask if user wants to continue with frontend deployment
    read -p "Do you want to continue with Vercel frontend deployment? (y/n): " continue_frontend
    
    if [[ "$continue_frontend" =~ ^[Yy]$ ]]; then
        export BACKEND_URL="$RAILWAY_URL"
        ../scripts/deploy-vercel.sh
    fi
}

main() {
    log "Starting Railway deployment for PME2GO Backend..."
    echo
    
    check_requirements
    setup_railway_project
    configure_environment
    setup_database
    deploy_application
    setup_domain
    
    success "Railway deployment completed!"
    echo
    echo "Next steps:"
    echo "1. Configure your custom domain (optional)"
    echo "2. Set up monitoring and logging"
    echo "3. Configure backup automation"
    echo "4. Deploy frontend to Vercel"
    echo
    echo "Railway Dashboard: https://railway.app/dashboard"
}

main "$@"