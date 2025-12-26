# Production Deployment Checklist

Use this checklist before deploying to production and after each deployment.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] Security audit passed (`npm audit`)
- [ ] Dependencies updated and reviewed

### Configuration
- [ ] All environment variables documented in `ENVIRONMENT_VARIABLES.md`
- [ ] Production environment variables set in Render
- [ ] Database connection string configured
- [ ] JWT secrets generated (min 32 characters)
- [ ] CORS origin set to production frontend URL
- [ ] File upload directory configured (Render disk or S3)

### Security
- [ ] Strong JWT secrets (different from development)
- [ ] Strong database password
- [ ] HTTPS/SSL configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] File upload limits configured
- [ ] No secrets in code or logs

### Database
- [ ] Database migrations tested
- [ ] Backup strategy configured
- [ ] Database connection pooling configured
- [ ] Database indexes verified
- [ ] Test restore procedure documented

### Monitoring & Alerts
- [ ] Sentry DSN configured
- [ ] Error tracking tested
- [ ] Uptime monitoring set up
- [ ] Health check endpoint working
- [ ] Alert contacts configured
- [ ] Log aggregation set up (optional)

### Documentation
- [ ] README updated
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] API documentation updated (if applicable)
- [ ] Runbook created for common issues

## Deployment Steps

### 1. Pre-Deployment
- [ ] Create deployment branch
- [ ] Merge all tested changes
- [ ] Update version numbers (if applicable)
- [ ] Create deployment tag/commit

### 2. Database
- [ ] Backup current database
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify migrations completed successfully
- [ ] Test database connectivity

### 3. Build
- [ ] Backend builds successfully: `npm run build`
- [ ] Frontend builds successfully: `npm run build`
- [ ] No build warnings or errors
- [ ] Build artifacts verified

### 4. Deploy
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Wait for services to start
- [ ] Verify health checks pass

### 5. Post-Deployment Verification

#### Backend
- [ ] Health endpoint responds: `GET /api/health`
- [ ] Database connection working
- [ ] Authentication endpoints working
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Error tracking sending events

#### Frontend
- [ ] Frontend loads without errors
- [ ] Login page accessible
- [ ] Authentication flow works
- [ ] All pages load correctly
- [ ] API calls successful
- [ ] WebSocket connections working
- [ ] Photo uploads working
- [ ] Language toggle working

#### Integration
- [ ] End-to-end user flow tested
- [ ] Create entry flow works
- [ ] Exit entry flow works
- [ ] Photo upload works
- [ ] Reports generate correctly
- [ ] Search functionality works
- [ ] Real-time updates working

### 6. Monitoring
- [ ] Check Sentry for errors
- [ ] Verify uptime monitoring shows healthy
- [ ] Check application logs for errors
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Verify backup script runs (if scheduled)

### 7. Rollback Plan
- [ ] Previous version tagged
- [ ] Database rollback procedure documented
- [ ] Rollback steps tested (in staging)
- [ ] Team notified of deployment

## Post-Deployment (First 24 Hours)

### Immediate (First Hour)
- [ ] Monitor error rates
- [ ] Check application logs
- [ ] Verify all critical features
- [ ] Monitor response times
- [ ] Check database performance

### Short Term (First 24 Hours)
- [ ] Monitor user activity
- [ ] Check for any user-reported issues
- [ ] Review error tracking
- [ ] Monitor resource usage
- [ ] Verify backups are running
- [ ] Check alert notifications

### Documentation
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned
- [ ] Update deployment notes
- [ ] Communicate deployment status to team

## Emergency Procedures

### Service Down
1. Check Render dashboard
2. Review recent deployments
3. Check error logs
4. Verify database connectivity
5. Restart service if needed
6. Rollback if necessary

### High Error Rate
1. Check Sentry for error details
2. Identify error pattern
3. Check recent code changes
4. Review application logs
5. Deploy hotfix if critical

### Database Issues
1. Check database status
2. Review connection pool
3. Check for slow queries
4. Review database logs
5. Scale database if needed

### Performance Issues
1. Check response times
2. Review slow queries
3. Check resource usage
4. Review application logs
5. Scale services if needed

## Regular Maintenance

### Daily
- [ ] Check error rates
- [ ] Review critical alerts
- [ ] Monitor resource usage

### Weekly
- [ ] Review error logs
- [ ] Check backup status
- [ ] Review performance metrics
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Security audit
- [ ] Dependency updates
- [ ] Performance review
- [ ] Backup restore test
- [ ] Documentation review

## Environment-Specific Notes

### Render Deployment
- [ ] Render disk storage configured (for photos)
- [ ] Environment variables set in Render dashboard
- [ ] Build command verified
- [ ] Start command verified
- [ ] Health check URL configured
- [ ] Auto-deploy settings reviewed

### Database (Render PostgreSQL)
- [ ] Database created
- [ ] Connection string configured
- [ ] Backup retention set
- [ ] Performance tier appropriate

## Sign-Off

- [ ] Technical lead approval
- [ ] QA verification (if applicable)
- [ ] Product owner approval (if applicable)
- [ ] Deployment documented
- [ ] Team notified

---

**Last Updated:** December 26, 2025  
**Version:** 1.0

