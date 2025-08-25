# PME2GO Vercel + Railway Deployment Guide

Deploy PME2GO with **Vercel** for the frontend and **Railway** for the backend - the modern, serverless approach!

## 🚀 **Quick Deployment**

### Prerequisites
- Node.js 18+ installed
- Git repository set up
- Railway account: https://railway.app
- Vercel account: https://vercel.com

## 📋 **Step-by-Step Deployment**

### **Step 1: Deploy Backend to Railway**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Navigate to your project
cd PME2GO

# 3. Run Railway deployment script
./scripts/deploy-railway.sh
```

**What this script does:**
- ✅ Sets up Railway project
- ✅ Configures PostgreSQL database
- ✅ Sets environment variables
- ✅ Deploys backend API
- ✅ Provides your backend URL

### **Step 2: Deploy Frontend to Vercel**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Run Vercel deployment script
./scripts/deploy-vercel.sh

# Enter your Railway backend URL when prompted
# Example: https://your-app-name.railway.app
```

**What this script does:**
- ✅ Builds React application
- ✅ Configures API endpoint
- ✅ Deploys to Vercel
- ✅ Sets up production environment

## ⚙️ **Manual Configuration**

### **Railway Backend Setup**

1. **Create Railway Account** at https://railway.app
2. **Install CLI**: `npm install -g @railway/cli`
3. **Login**: `railway login`
4. **Initialize Project**: `railway init`

#### **Environment Variables to Set:**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-256-bit-secret"
railway variables set BCRYPT_ROUNDS=12

# Email Configuration
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password
railway variables set FROM_EMAIL=noreply@pme2go.com
```

5. **Add PostgreSQL**: `railway add postgresql`
6. **Deploy**: `railway up`

### **Vercel Frontend Setup**

1. **Create Vercel Account** at https://vercel.com
2. **Install CLI**: `npm install -g vercel`
3. **Login**: `vercel login`

#### **Environment Variables to Set:**
```bash
# In Vercel Dashboard or via CLI
vercel env add REACT_APP_API_URL production
# Enter your Railway URL: https://your-app.railway.app
```

4. **Deploy**: `vercel --prod`

## 🌐 **Configuration Details**

### **Backend Environment Variables (Railway)**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (auto-set by Railway) | `postgresql://...` |
| `JWT_SECRET` | 256-bit secret for JWT tokens | `your-secret-key` |
| `NODE_ENV` | Environment | `production` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email password/app password | `your-app-password` |
| `FROM_EMAIL` | From email address | `noreply@pme2go.com` |

### **Frontend Environment Variables (Vercel)**

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://your-app.railway.app` |

## 🔧 **Post-Deployment Configuration**

### **1. Update CORS Settings**

Your Railway backend needs to allow requests from your Vercel frontend:

```javascript
// This is automatically handled in secure-server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
```

Set in Railway:
```bash
railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
```

### **2. Custom Domains (Optional)**

#### **Railway Custom Domain:**
1. Go to Railway Dashboard → Your Project → Settings
2. Add your custom domain (e.g., `api.pme2go.com`)
3. Update DNS records as instructed

#### **Vercel Custom Domain:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `pme2go.com`)
3. Update DNS records as instructed

### **3. Database Setup**

Your database will be automatically created by Railway, but you may need to run initial setup:

```bash
# Connect to Railway database and run setup
railway connect postgresql
```

Then run your SQL initialization scripts if needed.

## 📊 **Monitoring & Logging**

### **Railway Monitoring**
- **Metrics**: View in Railway Dashboard
- **Logs**: `railway logs` or in dashboard
- **Performance**: Built-in monitoring

### **Vercel Monitoring**
- **Analytics**: Built-in Vercel Analytics
- **Logs**: View in Vercel Dashboard
- **Performance**: Real User Monitoring

## 🛠️ **Development Workflow**

### **Local Development**
```bash
# Backend (connects to Railway database)
cd server
NODE_ENV=development railway run node secure-server.js

# Frontend (points to Railway backend)
npm start
```

### **Continuous Deployment**

Both platforms support automatic deployments:

#### **Railway**: 
- Automatically deploys on git push to main branch
- Configure in Railway Dashboard → Settings → Service

#### **Vercel**:
- Automatically deploys on git push to main branch  
- Configure in Vercel Dashboard → Settings → Git

## 🔐 **Security Best Practices**

### **Environment Variables**
- ✅ Use strong JWT secrets (256-bit)
- ✅ Use app passwords for email
- ✅ Never commit secrets to git
- ✅ Use different secrets for staging/production

### **CORS Configuration**
- ✅ Set specific frontend URLs
- ✅ Don't use wildcard (*) in production
- ✅ Enable credentials only when needed

### **Database Security**
- ✅ Railway PostgreSQL is automatically secured
- ✅ Use SSL connections (enabled by default)
- ✅ Regular backups (Railway handles this)

## 🚨 **Troubleshooting**

### **Common Issues**

#### **CORS Errors**
```bash
# Update Railway FRONTEND_URL
railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### **Database Connection**
```bash
# Check Railway database status
railway status

# View database logs
railway logs --service postgresql
```

#### **Build Failures**
```bash
# Clear build cache
vercel --prod --force

# Check build logs
vercel logs your-deployment-url
```

#### **Environment Variables**
```bash
# List Railway variables
railway variables

# List Vercel variables  
vercel env ls
```

## 💰 **Pricing Information**

### **Railway**
- **Hobby Plan**: $5/month per user
- **Team Plan**: $20/month per user
- Includes PostgreSQL database
- Pay-per-use for resources

### **Vercel**
- **Hobby Plan**: Free
- **Pro Plan**: $20/month per user
- Unlimited static deployments
- Serverless functions included

## 🔄 **Updating Your Application**

### **Backend Updates**
```bash
git push origin main
# Railway automatically deploys
```

### **Frontend Updates**
```bash
git push origin main  
# Vercel automatically deploys
```

### **Manual Redeploy**
```bash
# Railway
railway up

# Vercel
vercel --prod
```

## 📈 **Scaling**

### **Railway Scaling**
- **Automatic**: Railway scales automatically
- **Manual**: Upgrade plan for more resources
- **Database**: Automatic scaling included

### **Vercel Scaling**
- **Automatic**: Serverless, scales to zero
- **Global CDN**: Automatic worldwide distribution
- **Edge Functions**: Deploy logic closer to users

## ✅ **Post-Deployment Checklist**

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Database initialized
- [ ] Email service configured
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active
- [ ] Performance monitoring set up
- [ ] Error tracking configured

## 🎉 **You're Live!**

Your PME2GO application is now deployed with:

- ⚡ **Lightning-fast** Vercel frontend
- 🚀 **Scalable** Railway backend  
- 📊 **Built-in monitoring**
- 🔒 **Enterprise security**
- 🌍 **Global CDN**
- 💾 **Managed database**

**Frontend URL**: `https://your-app.vercel.app`  
**Backend URL**: `https://your-app.railway.app`  
**Admin Dashboard**: `https://your-app.railway.app/api/admin/performance/dashboard`

---

## 📞 **Support**

- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support  
- **PME2GO**: Create an issue in your GitHub repository

**Happy deploying! 🚀**