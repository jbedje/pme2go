# 🚄 Deploy PME2GO to Railway

Railway is the **recommended free hosting** for PME2GO because it provides:
- Free PostgreSQL database
- Docker support
- Automatic deployments from Git
- $5/month free credits (sufficient for small apps)

## 🚀 Quick Deployment

### 1. Prepare Your Repository

```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

**Option A: One-Click Deploy**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/lmgM1H)

**Option B: Manual Setup**

1. **Sign up**: Visit [railway.app](https://railway.app) and sign up with GitHub
2. **Create new project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select repository**: Choose your PME2GO repository
4. **Add database**: Click "New" → "Database" → "PostgreSQL"

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
NODE_ENV=production
REACT_APP_API_URL=https://your-app-name.up.railway.app
REACT_APP_FRONTEND_URL=https://your-app-name.up.railway.app
JWT_SECRET=your-generated-secret-here
BCRYPT_ROUNDS=12
```

Railway will automatically provide:
- `DATABASE_URL` (PostgreSQL connection)
- `PORT` (application port)

### 4. Deploy

Railway automatically deploys when you push to your main branch!

```bash
git push origin main
# Railway automatically builds and deploys
```

## 🔧 Configuration Details

### Environment Variables (Auto-provided by Railway)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port (Railway assigns this)
- `RAILWAY_ENVIRONMENT` - Environment name

### Custom Variables to Add
```env
NODE_ENV=production
JWT_SECRET=<generate-32-byte-secret>
JWT_REFRESH_SECRET=<generate-32-byte-secret>
BCRYPT_ROUNDS=12
REACT_APP_API_URL=https://$RAILWAY_PUBLIC_DOMAIN
REACT_APP_FRONTEND_URL=https://$RAILWAY_PUBLIC_DOMAIN
```

## 📊 Monitoring

### Check Deployment Status
- **Dashboard**: Visit your Railway project dashboard
- **Logs**: View real-time logs in Railway console
- **Health**: Visit `https://your-app.up.railway.app/api/health`

### Railway CLI (Optional)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs

# Deploy manually
railway up
```

## 💰 Cost Estimation

**Free Tier Includes:**
- $5 monthly credit
- PostgreSQL database
- Automatic deployments
- Custom domains

**Typical Usage:**
- Small app: ~$3-4/month
- Medium traffic: ~$8-10/month

## 🔄 Updates & Maintenance

### Automatic Deployments
Every push to `main` branch triggers automatic deployment.

### Manual Deployment
```bash
# Using CLI
railway up

# Using Git
git push origin main
```

### Database Migrations
Railway runs migrations automatically during deployment via the startup script.

### View Application
Your app will be available at: `https://your-app-name.up.railway.app`

## 🚨 Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Check logs in Railway dashboard
# Common fix: ensure all dependencies are in package.json
npm install --save missing-package
```

**2. Database Connection Issues**
- Verify `DATABASE_URL` is available in environment variables
- Check database service is running in Railway dashboard

**3. Port Issues**
- Railway automatically sets `PORT` environment variable
- Application should use `process.env.PORT`

**4. Environment Variables**
- Double-check all required variables are set
- Redeploy after adding new variables

### Support
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Documentation: [docs.railway.app](https://docs.railway.app)

## ✅ Success Checklist

- [ ] Repository pushed to GitHub
- [ ] Railway project created and connected
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Application deployed successfully
- [ ] Health check returns 200 OK
- [ ] Database migrations completed
- [ ] Demo login works

Your PME2GO application is now live on Railway! 🎉