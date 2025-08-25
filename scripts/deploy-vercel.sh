#!/bin/bash

# PME2GO Vercel Frontend Deployment Script

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
    log "Checking Vercel deployment requirements..."
    
    if ! command -v vercel &> /dev/null; then
        log "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    success "Requirements check passed"
}

setup_environment() {
    log "Setting up environment variables..."
    
    # Get Railway backend URL from user
    read -p "Enter your Railway backend URL (e.g., https://your-app.railway.app): " BACKEND_URL
    
    if [[ -z "$BACKEND_URL" ]]; then
        error "Backend URL is required"
    fi
    
    # Create .env.production for React build
    cat > .env.production << EOF
REACT_APP_API_URL=${BACKEND_URL}
REACT_APP_WS_URL=${BACKEND_URL}
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.0.0
EOF
    
    success "Environment configured with backend: $BACKEND_URL"
}

build_application() {
    log "Building React application..."
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    if [[ ! -d "build" ]]; then
        error "Build failed - build directory not found"
    fi
    
    success "React application built successfully"
}

deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    # Set environment variable in Vercel
    vercel env add REACT_APP_API_URL production <<< "$BACKEND_URL"
    
    # Deploy to production
    vercel --prod
    
    success "Deployed to Vercel successfully!"
}

main() {
    log "Starting Vercel deployment for PME2GO Frontend..."
    echo
    
    check_requirements
    setup_environment
    build_application
    deploy_to_vercel
    
    success "Deployment completed!"
    echo
    echo "Next steps:"
    echo "1. Configure your custom domain in Vercel dashboard"
    echo "2. Set up SSL certificate (automatic with Vercel)"
    echo "3. Update your backend CORS settings with the new domain"
    echo
    echo "Vercel Dashboard: https://vercel.com/dashboard"
}

main "$@"