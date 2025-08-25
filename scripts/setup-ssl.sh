#!/bin/bash

# SSL Setup Script for PME2GO Production
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-pme2go.com}
EMAIL=${2:-admin@pme2go.com}
WEBROOT_PATH="/var/www/certbot"

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
    log "Checking SSL setup requirements..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if [[ -z "$DOMAIN" ]]; then
        error "Domain name is required"
    fi
    
    if [[ -z "$EMAIL" ]]; then
        error "Email address is required"
    fi
    
    success "Requirements check passed"
}

create_directories() {
    log "Creating SSL directories..."
    
    mkdir -p ssl/live ssl/archive
    mkdir -p /var/www/certbot
    
    success "SSL directories created"
}

generate_self_signed_cert() {
    log "Generating self-signed certificate for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/pme2go.key \
        -out ssl/pme2go.crt \
        -subj "/C=US/ST=State/L=City/O=PME2GO/CN=$DOMAIN"
    
    success "Self-signed certificate generated"
}

setup_letsencrypt() {
    log "Setting up Let's Encrypt SSL certificate..."
    
    # Stop nginx if running
    docker-compose down nginx 2>/dev/null || true
    
    # Request certificate
    docker run -it --rm --name certbot \
        -v "$PWD/ssl:/etc/letsencrypt" \
        -v "$WEBROOT_PATH:/var/www/certbot" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN"
    
    # Copy certificates to expected location
    cp "ssl/live/$DOMAIN/fullchain.pem" ssl/pme2go.crt
    cp "ssl/live/$DOMAIN/privkey.pem" ssl/pme2go.key
    
    success "Let's Encrypt certificate obtained"
}

setup_cert_renewal() {
    log "Setting up certificate auto-renewal..."
    
    # Create renewal script
    cat > ssl/renew-cert.sh << 'EOF'
#!/bin/bash
docker run --rm --name certbot \
    -v "$PWD/ssl:/etc/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    certbot/certbot renew \
    --webroot \
    --webroot-path=/var/www/certbot \
    --quiet

# Reload nginx if renewal was successful
if [ $? -eq 0 ]; then
    docker-compose exec nginx nginx -s reload
fi
EOF

    chmod +x ssl/renew-cert.sh
    
    # Add to crontab (run twice daily)
    (crontab -l 2>/dev/null; echo "0 12,0 * * * $PWD/ssl/renew-cert.sh") | crontab -
    
    success "Auto-renewal configured"
}

verify_certificate() {
    log "Verifying SSL certificate..."
    
    if [[ -f "ssl/pme2go.crt" && -f "ssl/pme2go.key" ]]; then
        # Check certificate validity
        openssl x509 -in ssl/pme2go.crt -text -noout | grep -E "Subject:|Issuer:|Not Before:|Not After:"
        success "Certificate verification passed"
    else
        error "Certificate files not found"
    fi
}

# Main setup process
main() {
    log "Starting SSL setup for domain: $DOMAIN"
    echo
    
    check_requirements
    create_directories
    
    # Ask user for certificate type
    echo "Choose SSL certificate type:"
    echo "1) Let's Encrypt (Production - requires valid domain)"
    echo "2) Self-signed (Development/Testing)"
    read -p "Enter your choice (1-2): " cert_choice
    
    case $cert_choice in
        1)
            setup_letsencrypt
            setup_cert_renewal
            ;;
        2)
            generate_self_signed_cert
            ;;
        *)
            error "Invalid choice"
            ;;
    esac
    
    verify_certificate
    
    success "SSL setup completed!"
    echo
    echo "Certificate files created:"
    echo "  - ssl/pme2go.crt (Certificate)"
    echo "  - ssl/pme2go.key (Private key)"
    echo
    echo "You can now start your application with:"
    echo "  ./scripts/deploy.sh"
}

# Show usage if no arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <domain> [email]"
    echo
    echo "Examples:"
    echo "  $0 pme2go.com admin@pme2go.com"
    echo "  $0 localhost"
    echo
    exit 1
fi

main "$@"