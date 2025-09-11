# 🎨 Deploy PME2GO to Render

Render offers excellent free hosting with PostgreSQL database included. Perfect for production-ready applications.

## 🚀 Quick Deployment

### Option A: One-Click Deploy

1. **Fork the repository** to your GitHub account
2. **Click Deploy**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/pme2go)

### Option B: Manual Setup

### 1. Create Render Account
Visit [render.com](https://render.com) and sign up with GitHub.

### 2. Create PostgreSQL Database

1. **Dashboard** → **New** → **PostgreSQL**
2. **Name**: `pme2go-db`
3. **Database**: `pme2go_production`
4. **User**: `pme2go_user`
5. **Region**: Choose closest to your users
6. **Plan**: Free

### 3. Create Web Service

1. **Dashboard** → **New** → **Web Service**
2. **Connect** your GitHub repository
3. **Configure**:
   - **Name**: `pme2go-app`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `node server/production-server.js`

### 4. Configure Environment Variables

Add these in the web service environment settings:

```env
NODE_ENV=production
SERVER_PORT=10000
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
BCRYPT_ROUNDS=12
```

**Database variables** (auto-filled from database):
- `DB_HOST` → Database internal hostname
- `DB_PORT` → Database port (5432)
- `DB_NAME` → pme2go_production
- `DB_USER` → pme2go_user
- `DB_PASSWORD` → Auto-generated password
- `DATABASE_URL` → Full connection string

**Frontend URLs** (update after deployment):
```env
REACT_APP_API_URL=https://your-service-name.onrender.com
REACT_APP_FRONTEND_URL=https://your-service-name.onrender.com
```

### 5. Deploy

Click **Create Web Service** - Render will automatically build and deploy!

## 🔧 Configuration Details

### Build Settings
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node server/production-server.js`
- **Node Version**: 18 (specified in package.json)

### Auto-Deploy
- Enabled by default
- Deploys on every push to `main` branch
- Build time: ~3-5 minutes

### Database Connection
Render automatically provides database connection details as environment variables.

## 📊 Monitoring

### Health Checks
- **URL**: `https://your-app.onrender.com/api/health`
- **Render Dashboard**: Shows service status and logs
- **Metrics**: Available in Render dashboard

### Logs
```bash
# View logs in Render dashboard
# Or use render CLI
npm install -g @render/cli
render auth
render logs --service your-service-name
```

## 💰 Free Tier Limits

**Web Services:**
- 750 hours/month free
- Services sleep after 15 minutes of inactivity
- 512MB RAM, 0.1 CPU

**PostgreSQL:**
- 1GB storage
- 90 days free, then $7/month
- Shared CPU

**Custom Domains:**
- Free SSL certificates
- Custom domains supported

## 🔄 Updates & Scaling

### Automatic Updates
Every push to `main` triggers a new deployment.

### Manual Deploy
```bash
# Trigger manual deploy in dashboard
# Or push empty commit
git commit --allow-empty -m "Manual deploy"
git push origin main
```

### Upgrade Options
- **Starter**: $7/month (always on, faster)
- **Standard**: $25/month (more resources)

## 🚨 Troubleshooting

### Service Sleeping
**Problem**: App sleeps after 15 minutes of inactivity
**Solutions**:
1. Use uptime monitoring (UptimeRobot, etc.)
2. Upgrade to paid plan
3. Accept 30-second cold start

### Build Failures
```bash
# Common issues:
1. Missing dependencies in package.json
2. Build command timeout
3. Memory issues during build

# Solutions:
- Optimize build process
- Use build cache
- Upgrade to paid plan for more resources
```

### Database Issues
```bash
# Check database status in dashboard
# Verify connection variables
# Test connection manually
```

## 🔒 Security Notes

- **HTTPS**: Automatic SSL certificates
- **Environment Variables**: Encrypted at rest
- **Database**: Isolated and backed up
- **Network**: Private internal networking

## ✅ Success Checklist

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service connected to GitHub
- [ ] Environment variables configured
- [ ] Application deployed successfully
- [ ] Health check accessible
- [ ] Database connection working
- [ ] Demo users can log in

Your PME2GO application is now live on Render! 🎉

**Next Steps:**
1. Set up monitoring for uptime
2. Configure custom domain (optional)
3. Monitor usage and upgrade if needed