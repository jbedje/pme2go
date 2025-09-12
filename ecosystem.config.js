module.exports = {
  apps: [
    {
      name: 'pme2go-api',
      script: 'server/production-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        SERVER_PORT: 3002
      },
      error_file: '/var/log/pm2/pme2go-api-error.log',
      out_file: '/var/log/pm2/pme2go-api-out.log',
      log_file: '/var/log/pm2/pme2go-api.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'pme2go-frontend',
      script: 'serve',
      args: ['-s', 'build', '-l', '3001'],
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/pme2go-frontend-error.log',
      out_file: '/var/log/pm2/pme2go-frontend-out.log',
      log_file: '/var/log/pm2/pme2go-frontend.log',
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