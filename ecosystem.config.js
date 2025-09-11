module.exports = {
  apps: [
    {
      name: 'pme2go-api',
      script: 'server/production-server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SERVER_PORT: 3002,
        WEBSOCKET_PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      log_file: 'logs/api.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'pme2go-websocket',
      script: 'server/websocket-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/ws-error.log',
      out_file: 'logs/ws-out.log',
      log_file: 'logs/ws.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ],
  
  deploy: {
    production: {
      user: 'pme2go',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/PME2GO.git',
      path: '/var/www/pme2go',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
}