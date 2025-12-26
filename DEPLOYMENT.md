# Deployment Guide

This guide covers deploying the Security Access Management System to production.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 14+ (if not using Docker)
- Node.js 18+ (for manual deployment)
- Domain name and SSL certificate (for production)
- DocuSign account with API credentials

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_access_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Secrets (generate strong random strings, min 32 characters)
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# DocuSign Integration
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_RSA_PRIVATE_KEY=your_rsa_private_key
DOCUSIGN_API_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_WEBHOOK_SECRET=your_webhook_secret
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_NAME=Security Access Management System
VITE_APP_VERSION=1.0.0
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Shield
   ```

2. **Set up environment variables:**
   - Copy `.env.example` files and configure them
   - Update `docker-compose.yml` with your environment variables

3. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

5. **Seed initial data (optional):**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

6. **Verify deployment:**
   - Backend: `http://localhost:3001/api/health`
   - Frontend: `http://localhost:80`

### Method 2: Manual Deployment

#### Backend Deployment

1. **Install dependencies:**
   ```bash
   cd backend
   npm ci --production
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Set up environment variables:**
   - Create `.env` file with production values

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

   Or use a process manager like PM2:
   ```bash
   pm2 start dist/server.js --name security-access-backend
   ```

#### Frontend Deployment

1. **Install dependencies:**
   ```bash
   cd frontend
   npm ci
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Serve the built files:**
   - Use nginx, Apache, or any static file server
   - Copy the `dist` folder contents to your web server root

## Production Configuration

### Database Setup

1. **Create production database:**
   ```sql
   CREATE DATABASE security_access_db;
   ```

2. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Seed initial data (optional):**
   ```bash
   npm run db:seed
   ```

### SSL/HTTPS Setup

For production, use a reverse proxy (nginx, Apache) with SSL certificates:

**Nginx Configuration Example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### DocuSign Webhook Configuration

1. **Configure webhook in DocuSign:**
   - Log in to DocuSign Admin
   - Navigate to Connect
   - Create a new Connect configuration
   - Set webhook URL: `https://api.yourdomain.com/api/hr/docusign/webhook`
   - Select events: `envelope-completed`, `envelope-declined`, `envelope-voided`
   - Set authentication method and secret

2. **Update environment variables:**
   - Set `DOCUSIGN_WEBHOOK_SECRET` to match DocuSign configuration

## Monitoring and Logging

### Health Checks

The application provides a health check endpoint:
- `GET /api/health` - Returns system health status

### Logging

- Application logs are written to console
- In production, configure log aggregation (e.g., ELK stack, CloudWatch)
- Logs include: errors, requests, system metrics

### Error Tracking

- Configure error tracking service (Sentry, LogRocket) in `backend/src/utils/errorTracker.ts`
- Update `trackError` function to send errors to your service

## Backup and Recovery

### Database Backups

**Automated backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres security_access_db > "$BACKUP_DIR/backup_$DATE.sql"
```

**Restore from backup:**
```bash
psql -U postgres security_access_db < backup_file.sql
```

### File Backups

- Backup `uploads` directory regularly
- Store backups in secure, off-site location

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure secure file upload limits
- [ ] Set up database backups
- [ ] Configure error tracking
- [ ] Review and update dependencies
- [ ] Set up monitoring and alerts
- [ ] Configure DocuSign webhook authentication

## Scaling

### Horizontal Scaling

- Use load balancer for multiple backend instances
- Configure shared session storage (Redis) if needed
- Use shared file storage (S3, NFS) for uploads

### Database Scaling

- Set up read replicas for read-heavy operations
- Configure connection pooling
- Monitor query performance

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check database is running
   - Verify connection credentials
   - Check network connectivity

2. **File upload errors:**
   - Verify upload directory permissions
   - Check disk space
   - Verify file size limits

3. **DocuSign integration errors:**
   - Verify API credentials
   - Check webhook URL is accessible
   - Verify webhook secret matches

### Logs

- Backend logs: Check console output or log files
- Database logs: Check PostgreSQL logs
- Web server logs: Check nginx/Apache logs

## Maintenance

### Regular Tasks

- Monitor system health endpoint
- Review error logs
- Update dependencies
- Backup database and files
- Review and rotate secrets
- Monitor disk space
- Review performance metrics

### Updates

1. Pull latest code
2. Run database migrations: `npm run db:migrate`
3. Rebuild and restart services
4. Verify health checks pass
5. Monitor for errors

## Support

For issues or questions:
- Check logs for error messages
- Review this documentation
- Contact system administrator















