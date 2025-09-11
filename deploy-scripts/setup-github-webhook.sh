#!/bin/bash

# GitHub Webhook Setup for VPS Deployment
# This script sets up a simple webhook receiver on your VPS

set -e

print_status() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

# Create webhook receiver
cat > webhook-server.js << 'EOF'
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-change-this';

app.use(express.json());

// Verify GitHub signature
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

app.post('/webhook', (req, res) => {
  const signature = req.get('X-Hub-Signature-256');
  const payload = JSON.stringify(req.body);
  
  if (!signature || !verifySignature(payload, signature)) {
    console.log('❌ Invalid signature');
    return res.status(401).send('Unauthorized');
  }

  const { ref, repository } = req.body;
  
  // Only deploy on push to main branch
  if (ref === 'refs/heads/main') {
    console.log(`🚀 Deploying ${repository.name} from ${ref}`);
    
    // Log deployment
    const logEntry = `${new Date().toISOString()} - Webhook deployment triggered\n`;
    fs.appendFileSync('/var/www/pme2go/logs/deployments.log', logEntry);
    
    // Execute deployment script
    exec('cd /var/www/pme2go && ./deploy-from-github.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Deployment failed: ${error}`);
        fs.appendFileSync('/var/www/pme2go/logs/deployments.log', 
          `${new Date().toISOString()} - Deployment failed: ${error.message}\n`);
        return;
      }
      
      console.log('✅ Deployment completed successfully');
      console.log(stdout);
      
      fs.appendFileSync('/var/www/pme2go/logs/deployments.log', 
        `${new Date().toISOString()} - Deployment completed successfully\n`);
    });
    
    res.status(200).send('Deployment triggered');
  } else {
    console.log(`ℹ️ Ignoring push to ${ref}`);
    res.status(200).send('Ignored');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔗 Webhook server listening on port ${PORT}`);
  console.log(`📋 Add this webhook URL to GitHub: http://YOUR_DOMAIN_OR_IP:${PORT}/webhook`);
});
EOF

# Create PM2 config for webhook server
cat > webhook.ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pme2go-webhook',
    script: 'webhook-server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-webhook-secret-change-this'
    },
    error_file: 'logs/webhook-error.log',
    out_file: 'logs/webhook-out.log',
    log_file: 'logs/webhook.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M'
  }]
}
EOF

# Add webhook port to firewall
sudo ufw allow 9000/tcp

print_success "✅ Webhook server configuration created"
print_status "📋 To start the webhook server:"
echo "   cd /var/www/pme2go"
echo "   pm2 start webhook.ecosystem.config.js"
echo ""
print_status "🔗 Add this webhook to your GitHub repository:"
echo "   URL: http://$(curl -s ifconfig.me):9000/webhook"
echo "   Content type: application/json"
echo "   Secret: your-webhook-secret-change-this"
echo "   Events: Just the push event"
EOF

chmod +x setup-github-webhook.sh