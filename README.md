# PME2GO - Professional Networking Platform

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pme2go)

PME2GO is a comprehensive professional networking platform built with React and Node.js, featuring real-time messaging, advanced search capabilities, and enterprise-grade security.

## 🚀 **Quick Deploy**

### **Option 1: GitHub → Railway + Vercel (Recommended)**

1. **Fork this repository** to your GitHub account
2. **Deploy Backend to Railway**: 
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Add PostgreSQL plugin
   - Set environment variables
3. **Deploy Frontend to Vercel**:
   - Go to [Vercel](https://vercel.com) 
   - Import your GitHub repository
   - Set `REACT_APP_API_URL` to your Railway URL
4. **Automatic deployments** on every git push!

### **Option 2: Manual CLI Deployment**

```bash
# Deploy backend to Railway
./scripts/deploy-railway.sh

# Deploy frontend to Vercel  
./scripts/deploy-vercel.sh
```

## ✨ **Features**

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Email verification system
- Password reset functionality
- Rate limiting and DDoS protection
- Security headers (Helmet.js)

### 💬 **Real-time Communication**
- WebSocket-based messaging system
- Real-time notifications
- Online status tracking
- Message history and persistence

### 🔍 **Advanced Search**
- Location-based filtering
- Skills and experience matching
- Fuzzy search capabilities
- Advanced filtering options

### 👤 **User Management**
- Complete user profiles
- Profile image uploads
- Skills and experience tracking
- Professional networking features

### 📊 **Admin Dashboard**
- System health monitoring
- Performance analytics
- User management
- Real-time metrics dashboard

### 🛠️ **Developer Features**
- Comprehensive API documentation
- Performance monitoring with Prometheus
- Structured logging with Winston
- Automated backup system
- Database constraints and validation

## 🏗️ **Technology Stack**

### **Frontend**
- **React 18** - Modern UI framework
- **Context API** - State management
- **CSS3** - Styling and animations
- **WebSocket** - Real-time communication

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **WebSocket** - Real-time features
- **Winston** - Logging system

### **Security & Performance**
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Helmet.js** - Security headers
- **Rate limiting** - API protection
- **Prometheus** - Metrics collection

### **Deployment**
- **Railway** - Backend hosting
- **Vercel** - Frontend hosting
- **Docker** - Containerization
- **GitHub Actions** - CI/CD (optional)

## 🚦 **Getting Started**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 13+
- Git

### **Local Development**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pme2go.git
   cd pme2go
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb pme2go
   
   # Run initial setup (if needed)
   psql -d pme2go -f database/init.sql
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd server && node secure-server.js
   
   # Frontend (Terminal 2)
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3004
   - Admin Dashboard: http://localhost:3004/api/admin/performance/dashboard

## 🌐 **Production Deployment**

### **Railway (Backend)**

1. **Connect GitHub repository**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Create new project from GitHub
   - Select your PME2GO repository

2. **Add PostgreSQL database**
   - Click "Add Plugin" → PostgreSQL
   - Database URL is automatically configured

3. **Configure environment variables**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-256-bit-secret
   SMTP_HOST=mail.smtp2go.com
   SMTP_USER=cipme.ci
   SMTP_PASS=your-smtp-password
   FROM_EMAIL=info@cipme.ci
   FROM_NAME=PME2GO
   ```

4. **Deploy**
   - Railway automatically deploys on git push to main branch

### **Vercel (Frontend)**

1. **Connect GitHub repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Import your PME2GO repository

2. **Configure environment variables**
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app
   ```

3. **Deploy**
   - Vercel automatically deploys on git push to main branch

## 📊 **API Documentation**

### **Authentication Endpoints**
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/refresh      - Refresh JWT token
POST /api/auth/logout       - User logout
GET  /api/auth/verify-email - Email verification
POST /api/auth/forgot-password - Password reset request
POST /api/auth/reset-password  - Password reset
```

### **User Management**
```
GET  /api/users             - Get all users (protected)
GET  /api/users/:id         - Get user by ID (protected)
PUT  /api/users/profile     - Update user profile (protected)
```

### **Search & Discovery**
```
GET  /api/search            - Search users (protected)
GET  /api/search/advanced   - Advanced search (protected)
```

### **Admin Endpoints**
```
GET  /api/admin/dashboard/stats       - Admin statistics
GET  /api/admin/users                 - User management
GET  /api/admin/performance/health    - System health
GET  /api/admin/performance/metrics   - Prometheus metrics
GET  /api/admin/performance/dashboard - Performance dashboard
```

## 🔧 **Environment Variables**

### **Backend (Railway)**
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | Yes |
| `DATABASE_URL` | PostgreSQL connection (auto-set) | Yes |
| `JWT_SECRET` | 256-bit secret for JWT tokens | Yes |
| `SMTP_HOST` | Email server hostname | Yes |
| `SMTP_USER` | Email username | Yes |
| `SMTP_PASS` | Email password | Yes |
| `FROM_EMAIL` | From email address | Yes |
| `FROM_NAME` | Email sender name | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

### **Frontend (Vercel)**
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |

## 📈 **Monitoring & Analytics**

### **Performance Dashboard**
Access real-time performance metrics at:
`https://your-railway-app.railway.app/api/admin/performance/dashboard`

**Features:**
- System health monitoring
- Request/response metrics
- Error tracking
- Database performance
- Memory and CPU usage

### **Admin Credentials**
- **Email**: admin@pme360.com
- **Password**: password123
- Change these in production!

### **Logging**
- Structured JSON logging with Winston
- Multiple log levels (error, warn, info, debug)
- Daily log rotation
- Performance tracking

## 🔒 **Security Features**

- **HTTPS Enforcement** - All traffic encrypted
- **Security Headers** - XSS, CSRF, and other protections
- **Rate Limiting** - API endpoint protection (100 req/15min)
- **Input Validation** - All inputs sanitized
- **SQL Injection Prevention** - Parameterized queries
- **Password Security** - bcrypt with 12 rounds
- **JWT Security** - 24-hour token expiration

## 📁 **Project Structure**

```
PME2GO/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   └── utils/             # Utility functions
├── server/                # Node.js backend
│   ├── secure-server.js   # Main server file
│   ├── logger.js          # Logging system
│   ├── performance-api.js # Performance monitoring
│   └── email-service.js   # Email functionality
├── database/              # Database scripts
├── scripts/               # Deployment scripts
├── monitoring/            # Monitoring configuration
└── docs/                  # Documentation
```

## 🛠️ **Development**

### **Available Scripts**

```bash
# Frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests

# Backend
node server/secure-server.js  # Start backend server

# Deployment
./scripts/deploy-railway.sh   # Deploy to Railway
./scripts/deploy-vercel.sh    # Deploy to Vercel
```

### **Admin Features**
- User management interface
- System health dashboard
- Performance monitoring
- Real-time analytics
- Backup management

## 🎯 **Live Demo**

- **Frontend**: https://pme2go.vercel.app (when deployed)
- **Backend API**: https://pme2go.railway.app (when deployed)
- **Admin Dashboard**: https://pme2go.railway.app/api/admin/performance/dashboard

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the deployment guides
- **Issues**: Open a GitHub issue
- **Email**: info@cipme.ci

## 🚀 **Production Ready**

This application includes:

✅ **Security**: JWT auth, bcrypt, rate limiting, security headers  
✅ **Performance**: Connection pooling, caching, monitoring  
✅ **Reliability**: Error handling, logging, health checks  
✅ **Scalability**: Containerized, auto-scaling ready  
✅ **Monitoring**: Real-time dashboards, metrics, alerts  
✅ **Backups**: Automated backup and recovery system  

## 🎯 **Roadmap**

- [ ] Mobile app (React Native)
- [ ] Video calling integration
- [ ] Advanced AI matching
- [ ] Multi-language support
- [ ] Premium features
- [ ] Social media integration

---

**⭐ If you like this project, please give it a star on GitHub!**

Built with ❤️ for the PME ecosystem.