# PME2GO API Documentation

Version: 2.0.0  
Base URL: `http://localhost:3004/api`  
Authentication: JWT Bearer Token  

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check)
   - [Authentication Endpoints](#authentication-endpoints)
   - [User Management](#user-management)
   - [Admin Endpoints](#admin-endpoints)
6. [Data Models](#data-models)
7. [Security Features](#security-features)

## Overview

The PME2GO API is a secure REST API that provides functionality for a professional networking platform connecting SMEs, experts, investors, and other business professionals. The API uses JWT tokens for authentication and implements comprehensive security measures including rate limiting, input validation, and database constraints.

## Authentication

The API uses JWT (JSON Web Token) authentication with access and refresh tokens:

- **Access Token**: Valid for 24 hours, used for API requests
- **Refresh Token**: Valid for 7 days, used to obtain new access tokens
- **Authorization Header**: `Authorization: Bearer <access_token>`

### Token Structure
```javascript
{
  "userId": "uuid-string",
  "email": "user@example.com", 
  "type": "PME/Startup",
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "pme2go-api",
  "aud": "pme2go-frontend"
}
```

## Error Handling

All API endpoints return consistent error responses:

```javascript
{
  "error": "Human-readable error message in French",
  "code": "ERROR_CODE", // Optional machine-readable code
  "details": [] // Optional validation error details
}
```

### Common Error Codes
- `MISSING_TOKEN`: Authorization token not provided
- `TOKEN_EXPIRED`: Access token has expired  
- `INVALID_TOKEN`: Token is malformed or invalid
- `EMAIL_EXISTS`: Email already registered
- `DATABASE_OFFLINE`: Database connection unavailable
- `AUTH_REQUIRED`: Authentication required for this endpoint
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## API Endpoints

### Health Check

#### GET /api/health
Check API server status and database connectivity.

**Response:**
```javascript
{
  "status": "OK",
  "message": "PME2GO Secure API is running",
  "databaseConnected": true,
  "mode": "database",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "version": "2.0.0"
}
```

---

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```javascript
{
  "name": "Company Name", // 2-100 characters
  "email": "user@example.com", // Valid email
  "password": "SecurePass123!", // Min 8 chars, uppercase, lowercase, digit
  "type": "PME/Startup", // See User Types below
  "industry": "Technology", // Optional, max 100 chars
  "location": "Paris, France", // Optional, max 200 chars
  "description": "Company description" // Optional
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Compte créé avec succès. Un email de vérification a été envoyé.",
  "user": {
    "id": "uuid-string",
    "name": "Company Name",
    "email": "user@example.com",
    "type": "PME/Startup",
    "verified": false,
    "emailVerified": false,
    "avatar": "https://ui-avatars.com/api/?name=..."
  },
  "tokens": {
    "accessToken": "jwt-string",
    "refreshToken": "jwt-string"
  }
}
```

**User Types:**
- PME/Startup
- Expert/Consultant  
- Mentor
- Incubateur
- Investisseur
- Institution Financière
- Organisme Public
- Partenaire Tech

---

#### POST /api/auth/login
Authenticate user and obtain tokens.

**Request Body:**
```javascript
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": "uuid-string",
    "name": "User Name",
    "email": "user@example.com",
    "type": "PME/Startup",
    "verified": true,
    "emailVerified": true,
    "avatar": "https://ui-avatars.com/api/?name=..."
  },
  "tokens": {
    "accessToken": "jwt-string",
    "refreshToken": "jwt-string"
  }
}
```

---

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```javascript
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```javascript
{
  "success": true,
  "tokens": {
    "accessToken": "new-jwt-string",
    "refreshToken": "new-refresh-token"
  }
}
```

---

#### POST /api/auth/logout
**Authentication Required**

Invalidate user session and tokens.

**Response:**
```javascript
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

#### GET /api/auth/verify-email
Verify user email address using token from email.

**Query Parameters:**
- `token`: Verification token from email
- `email`: User email address

**Response:**
```javascript
{
  "success": true,
  "message": "Email vérifié avec succès"
}
```

---

#### POST /api/auth/resend-verification
Resend email verification.

**Request Body:**
```javascript
{
  "email": "user@example.com"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Email de vérification envoyé"
}
```

---

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```javascript
{
  "email": "user@example.com"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Instructions de réinitialisation envoyées par email"
}
```

---

#### POST /api/auth/reset-password
Reset password using token from email.

**Request Body:**
```javascript
{
  "token": "reset-token-from-email",
  "email": "user@example.com",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

### User Management

#### GET /api/users
**Authentication Required**

Get paginated list of users with optional filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `search`: Search in name, email, industry
- `type`: Filter by user type
- `industry`: Filter by industry
- `location`: Filter by location
- `verified`: Filter by verification status (true/false)

**Response:**
```javascript
{
  "success": true,
  "users": [
    {
      "id": "uuid-string",
      "name": "User Name",
      "email": "user@example.com",
      "type": "PME/Startup",
      "industry": "Technology",
      "location": "Paris, France",
      "bio": "User description",
      "verified": true,
      "avatar": "https://ui-avatars.com/api/?name=...",
      "stats": {
        "connections": 42,
        "rating": 4.8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### GET /api/users/:id
**Authentication Required**

Get detailed user profile by ID.

**Response:**
```javascript
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "name": "User Name",
    "email": "user@example.com",
    "type": "PME/Startup",
    "industry": "Technology",
    "location": "Paris, France",
    "bio": "Detailed user description",
    "verified": true,
    "emailVerified": true,
    "avatar": "https://ui-avatars.com/api/?name=...",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "stats": {
      "connections": 42,
      "rating": 4.8,
      "profileViews": 128
    }
  }
}
```

---

#### PUT /api/users/profile
**Authentication Required**

Update current user's profile.

**Request Body:**
```javascript
{
  "name": "Updated Company Name",
  "type": "Expert/Consultant", 
  "industry": "Finance",
  "location": "Lyon, France",
  "bio": "Updated description",
  "website": "https://example.com", // Optional
  "phone": "+33123456789", // Optional
  "skills": ["JavaScript", "React", "Node.js"], // Optional array
  "experience": 5, // Optional number of years
  "profilePicture": "data:image/jpeg;base64,..." // Optional base64 image
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "user": {
    // Updated user object
  }
}
```

---

### Admin Endpoints
**Admin Authentication Required**

All admin endpoints require users to have `admin` or `super_admin` role.

#### GET /api/admin/dashboard/stats
Get admin dashboard statistics.

**Response:**
```javascript
{
  "success": true,
  "stats": {
    "totalUsers": 1247,
    "newUsersToday": 23,
    "activeUsers": 856,
    "totalConnections": 3421,
    "verifiedUsers": 1089,
    "usersByType": {
      "PME/Startup": 456,
      "Expert/Consultant": 234,
      "Investisseur": 123
    },
    "monthlyGrowth": {
      "users": 15.4,
      "connections": 22.1
    }
  }
}
```

---

#### GET /api/admin/users
Get paginated list of all users for admin management.

**Query Parameters:**
- Same as `/api/users` plus:
- `role`: Filter by role (admin, super_admin)
- `banned`: Filter by ban status (true/false)
- `sortBy`: Sort by field (name, email, created_at)
- `sortOrder`: asc or desc

**Response:**
```javascript
{
  "success": true,
  "users": [
    {
      // Standard user object plus:
      "role": "admin",
      "banned": false,
      "lastLogin": "2025-01-23T09:15:00.000Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "loginCount": 42
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### GET /api/admin/users/:id
Get detailed user information for admin.

**Response:**
```javascript
{
  "success": true,
  "user": {
    // Standard user object plus admin fields:
    "role": "regular",
    "banned": false,
    "banReason": null,
    "lastLogin": "2025-01-23T09:15:00.000Z",
    "loginHistory": [
      {
        "timestamp": "2025-01-23T09:15:00.000Z",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0..."
      }
    ]
  }
}
```

---

#### PUT /api/admin/users/:id
Update user information (admin only).

**Request Body:**
```javascript
{
  "name": "Updated Name",
  "type": "Expert/Consultant",
  "verified": true,
  "role": "admin", // super_admin only
  "banned": false,
  "banReason": null
}
```

---

#### PUT /api/admin/users/:id/ban
Ban or unban a user (admin only).

**Request Body:**
```javascript
{
  "banned": true,
  "reason": "Violation of terms of service" // Required if banning
}
```

---

#### DELETE /api/admin/users/:id
**Super Admin Only**

Permanently delete a user account.

**Response:**
```javascript
{
  "success": true,
  "message": "Utilisateur supprimé définitivement"
}
```

---

#### GET /api/admin/system/health
Get detailed system health information.

**Response:**
```javascript
{
  "success": true,
  "health": {
    "database": {
      "connected": true,
      "latency": 12,
      "activeConnections": 3,
      "maxConnections": 20
    },
    "memory": {
      "used": "145MB",
      "total": "512MB",
      "percentage": 28.3
    },
    "uptime": "2d 14h 32m",
    "lastRestart": "2025-01-21T08:00:00.000Z"
  }
}
```

---

#### GET /api/admin/system/logs
Get system logs with filtering.

**Query Parameters:**
- `level`: Filter by log level (error, warn, info, debug)
- `limit`: Number of logs to return (default: 100)
- `startDate`: Start date filter (ISO string)
- `endDate`: End date filter (ISO string)

**Response:**
```javascript
{
  "success": true,
  "logs": [
    {
      "timestamp": "2025-01-23T10:30:00.000Z",
      "level": "error",
      "message": "Database connection failed",
      "details": { /* ... */ }
    }
  ]
}
```

---

#### GET /api/admin/system/settings
Get system configuration settings.

**Response:**
```javascript
{
  "success": true,
  "settings": {
    "registration": {
      "enabled": true,
      "emailVerificationRequired": true
    },
    "rateLimit": {
      "general": {
        "windowMs": 900000,
        "max": 100
      }
    }
  }
}
```

---

#### PUT /api/admin/system/settings
**Super Admin Only**

Update system settings.

**Request Body:**
```javascript
{
  "registration": {
    "enabled": true,
    "emailVerificationRequired": true
  }
}
```

---

## Data Models

### User Model
```javascript
{
  "id": "uuid-string", // Primary identifier
  "name": "string", // Display name or company name
  "email": "string", // Unique email address
  "type": "string", // User type (see enum above)
  "industry": "string|null", // Business industry
  "location": "string|null", // Geographic location
  "bio": "string|null", // Profile description
  "verified": "boolean", // Profile verification status
  "emailVerified": "boolean", // Email verification status
  "avatar": "string", // Avatar image URL
  "role": "string|null", // Admin role (admin, super_admin)
  "banned": "boolean", // Account ban status
  "createdAt": "ISO date string",
  "stats": {
    "connections": "number",
    "rating": "number",
    "profileViews": "number"
  }
}
```

### Token Model
```javascript
{
  "accessToken": "jwt-string", // 24h validity
  "refreshToken": "jwt-string" // 7d validity
}
```

### Pagination Model
```javascript
{
  "page": "number", // Current page
  "limit": "number", // Items per page
  "total": "number", // Total items
  "totalPages": "number", // Total pages
  "hasNext": "boolean", // Has next page
  "hasPrev": "boolean" // Has previous page
}
```

## Security Features

### Authentication & Authorization
- JWT tokens with RSA/HMAC signing
- Role-based access control (admin, super_admin)
- Token expiration and refresh mechanisms
- Secure password hashing with bcrypt (12 rounds)

### Input Validation
- Comprehensive validation with express-validator
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- File upload validation and size limits

### Security Headers
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Content Security Policy (CSP)
- Rate limiting with express-rate-limit

### Database Security
- Connection pooling with pg
- Comprehensive CHECK constraints
- Foreign key relationships
- Row-level security policies
- Audit logging for admin actions

### Email Security
- Email verification for new accounts
- Secure password reset flow
- HTML email templates with proper encoding
- Token-based verification system

### Production Considerations
- Environment-based configuration
- Database SSL support
- Structured logging for monitoring
- Health check endpoints for load balancers

---

**Last Updated:** January 2025  
**API Version:** 2.0.0  
**Documentation Version:** 1.0.0