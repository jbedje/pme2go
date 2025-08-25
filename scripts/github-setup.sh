#!/bin/bash

# PME2GO GitHub Repository Setup Script

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
    log "Checking GitHub setup requirements..."
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    if ! command -v gh &> /dev/null; then
        warning "GitHub CLI not installed. Install with: winget install GitHub.cli"
        echo "You can also create the repository manually at https://github.com/new"
    fi
    
    success "Requirements check passed"
}

initialize_git() {
    log "Initializing Git repository..."
    
    # Initialize git if not already initialized
    if [[ ! -d ".git" ]]; then
        git init
        success "Git repository initialized"
    else
        log "Git repository already exists"
    fi
    
    # Configure git user (if not already configured)
    if [[ -z "$(git config --global user.name 2>/dev/null)" ]]; then
        read -p "Enter your Git username: " git_username
        git config --global user.name "$git_username"
    fi
    
    if [[ -z "$(git config --global user.email 2>/dev/null)" ]]; then
        read -p "Enter your Git email: " git_email
        git config --global user.email "$git_email"
    fi
    
    success "Git configuration completed"
}

create_github_repo() {
    log "Creating GitHub repository..."
    
    if command -v gh &> /dev/null; then
        # Use GitHub CLI
        read -p "Enter repository name (default: pme2go): " repo_name
        repo_name=${repo_name:-pme2go}
        
        read -p "Make repository private? (y/N): " make_private
        
        if [[ "$make_private" =~ ^[Yy]$ ]]; then
            gh repo create "$repo_name" --private --description "PME2GO - Professional Networking Platform"
        else
            gh repo create "$repo_name" --public --description "PME2GO - Professional Networking Platform"
        fi
        
        # Set remote origin
        git remote add origin "https://github.com/$(gh api user --jq .login)/$repo_name.git"
        
        success "GitHub repository created: https://github.com/$(gh api user --jq .login)/$repo_name"
    else
        log "GitHub CLI not available. Please create repository manually:"
        echo "1. Go to https://github.com/new"
        echo "2. Create a new repository named 'pme2go'"
        echo "3. Copy the repository URL"
        read -p "Enter your GitHub repository URL: " repo_url
        git remote add origin "$repo_url"
        success "Remote origin set to: $repo_url"
    fi
}

prepare_files() {
    log "Preparing files for GitHub..."
    
    # Remove sensitive files from git tracking
    if [[ -f ".env.production" ]]; then
        echo ".env.production" >> .gitignore
    fi
    
    if [[ -f ".env.railway" ]]; then
        echo ".env.railway" >> .gitignore
    fi
    
    # Create environment template
    if [[ -f ".env.production" && ! -f ".env.example" ]]; then
        cp .env.production .env.example
        # Replace sensitive values with placeholders
        sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=your-database-password/' .env.example
        sed -i 's/JWT_SECRET=.*/JWT_SECRET=your-256-bit-jwt-secret/' .env.example
        sed -i 's/SMTP_PASS=.*/SMTP_PASS=your-smtp-password/' .env.example
        success ".env.example template created"
    fi
    
    success "Files prepared for GitHub"
}

commit_and_push() {
    log "Committing and pushing to GitHub..."
    
    # Add all files
    git add .
    
    # Create initial commit
    git commit -m "🚀 Initial commit: PME2GO Professional Networking Platform

Features:
✅ Complete React frontend with real-time messaging
✅ Node.js backend with JWT authentication
✅ PostgreSQL database with comprehensive schema
✅ Real-time WebSocket communication
✅ Advanced search and filtering
✅ Admin dashboard with performance monitoring
✅ Email verification and password reset
✅ Production-ready deployment configs
✅ Automated backup and recovery system
✅ Performance monitoring with Prometheus
✅ Security hardening and rate limiting

🎯 Ready for deployment to Railway + Vercel!

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    # Push to GitHub
    git branch -M main
    git push -u origin main
    
    success "Code pushed to GitHub successfully!"
}

setup_github_actions() {
    log "Setting up GitHub Actions (optional)..."
    
    read -p "Do you want to set up GitHub Actions for CI/CD? (y/N): " setup_actions
    
    if [[ "$setup_actions" =~ ^[Yy]$ ]]; then
        mkdir -p .github/workflows
        
        cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Railway and Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test --if-present
    
    - name: Run linting
      run: npm run lint --if-present

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: railway-app/railway-action@v1
      with:
        api-token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
EOF
        
        git add .github/workflows/deploy.yml
        git commit -m "🔄 Add GitHub Actions CI/CD workflow"
        git push
        
        success "GitHub Actions workflow created"
        echo
        echo "To complete GitHub Actions setup:"
        echo "1. Go to your GitHub repository settings"
        echo "2. Add these secrets:"
        echo "   - RAILWAY_TOKEN (from Railway dashboard)"
        echo "   - VERCEL_TOKEN (from Vercel settings)"
        echo "   - VERCEL_ORG_ID (from Vercel project settings)"
        echo "   - VERCEL_PROJECT_ID (from Vercel project settings)"
    fi
}

show_next_steps() {
    echo
    echo -e "${GREEN}🎉 GitHub setup completed!${NC}"
    echo
    echo "📋 Next Steps:"
    echo
    echo "1. 🚂 Deploy Backend to Railway:"
    echo "   - Go to https://railway.app/dashboard"
    echo "   - Create new project from GitHub"
    echo "   - Select your PME2GO repository"
    echo "   - Add PostgreSQL plugin"
    echo "   - Set environment variables"
    echo
    echo "2. ⚡ Deploy Frontend to Vercel:"
    echo "   - Go to https://vercel.com/dashboard"
    echo "   - Import your GitHub repository"
    echo "   - Set REACT_APP_API_URL environment variable"
    echo
    echo "3. 🔄 Automatic Deployments:"
    echo "   - Both platforms will auto-deploy on git push"
    echo "   - Your app will be live in minutes!"
    echo
    echo "🌐 Your repository is ready for deployment!"
}

# Main setup process
main() {
    log "Starting GitHub setup for PME2GO..."
    echo
    
    check_requirements
    initialize_git
    prepare_files
    create_github_repo
    commit_and_push
    setup_github_actions
    show_next_steps
    
    success "GitHub setup completed successfully!"
}

main "$@"