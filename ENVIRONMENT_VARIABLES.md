# Environment Variables Guide

This document lists all required and optional environment variables for the application.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Required Variables

```bash
# Application Environment
NODE_ENV=production
PORT=3001

# CORS Configuration
# Set to your frontend URL (e.g., https://yourdomain.com)
CORS_ORIGIN=https://yourdomain.com

# Database Configuration
# Option 1: Use DATABASE_URL (recommended for production)
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Option 2: Use individual variables
# DB_HOST=your_db_host
# DB_PORT=5432
# DB_NAME=your_database_name
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password

# JWT Configuration
# Generate strong secrets (min 32 characters)
# Use: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_here_min_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret_here_min_32_characters
JWT_REFRESH_EXPIRES_IN=7d
```

### Optional Variables

```bash
# File Upload Configuration
# For local development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# For Render production with persistent disk
RENDER_DISK_PATH=/var/data

# DocuSign Configuration (for HR document management)
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_RSA_PRIVATE_KEY=your_rsa_private_key
DOCUSIGN_API_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_WEBHOOK_SECRET=your_webhook_secret

# Error Tracking (Sentry)
SENTRY_DSN=your_sentry_dsn_here
```

## Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

### Required Variables

```bash
# API Base URL
# For production, set to your backend API URL
VITE_API_BASE_URL=https://api.yourdomain.com/api

# WebSocket URL (optional, auto-detected if not set)
VITE_WS_URL=wss://api.yourdomain.com
```

### Development Defaults

If not set, the frontend will auto-detect:
- Development: `http://localhost:3001/api`
- Render: Auto-detects Render backend URL
- Custom domains: Auto-detects based on hostname

## Generating Secrets

### JWT Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh token secret
openssl rand -base64 32
```

### Database Password

Use a strong password generator or:
```bash
openssl rand -base64 24
```

## Render Configuration

### Backend Service Environment Variables

Set these in your Render backend service:

```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=<your_render_database_url>
JWT_SECRET=<generated_secret>
JWT_REFRESH_SECRET=<generated_secret>
RENDER_DISK_PATH=/var/data
SENTRY_DSN=<your_sentry_dsn>
```

### Frontend Service Environment Variables

Set these in your Render frontend service:

```
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
```

## Security Notes

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use strong secrets** - Minimum 32 characters for JWT secrets
3. **Rotate secrets regularly** - Especially after security incidents
4. **Use different secrets** - For development, staging, and production
5. **Store secrets securely** - Use a secrets manager in production

## Validation

The backend validates all environment variables on startup. If any required variable is missing or invalid, the application will fail to start with a clear error message.

