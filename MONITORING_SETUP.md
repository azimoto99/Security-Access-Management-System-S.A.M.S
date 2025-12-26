# Monitoring and Alerting Setup Guide

This guide helps you set up comprehensive monitoring and alerting for your production application.

## 1. Error Tracking with Sentry

### Setup

1. **Create a Sentry account** at https://sentry.io
2. **Create a new project** (Node.js)
3. **Get your DSN** from project settings
4. **Install Sentry SDK** (optional - already integrated with lazy loading):
   ```bash
   cd backend
   npm install @sentry/node
   ```
5. **Set environment variable** in Render:
   ```
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   ```

### What Gets Tracked

- Unhandled exceptions
- Unhandled promise rejections
- Application errors with context
- Request metadata (user, IP, user agent)
- Error stack traces

### Viewing Errors

- Go to your Sentry dashboard
- Errors appear in real-time
- Set up alerts for critical errors

## 2. Uptime Monitoring

### Option 1: UptimeRobot (Free)

1. **Sign up** at https://uptimerobot.com
2. **Add a monitor**:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Your email
3. **Set up alerts** for:
   - Service down
   - Response time > 5 seconds

### Option 2: Pingdom

1. **Sign up** at https://www.pingdom.com
2. **Create uptime check**:
   - URL: `https://your-backend.onrender.com/api/health`
   - Check interval: 1 minute
   - Alert threshold: 2 consecutive failures

### Option 3: Render Built-in Monitoring

Render provides basic monitoring:
- Go to your service dashboard
- View metrics: CPU, Memory, Response time
- Set up alerts in service settings

## 3. Application Performance Monitoring (APM)

### Option 1: Sentry Performance

Sentry includes performance monitoring:
- Already integrated if Sentry is set up
- View transaction traces
- Identify slow endpoints
- Set performance budgets

### Option 2: New Relic (Paid)

1. **Sign up** at https://newrelic.com
2. **Install agent**:
   ```bash
   npm install newrelic
   ```
3. **Configure** in `backend/src/server.ts`
4. **Set license key** in environment variables

## 4. Log Aggregation

### Option 1: Render Logs

- Render provides log streaming
- View logs in Render dashboard
- Export logs for analysis

### Option 2: Logtail (Recommended)

1. **Sign up** at https://logtail.com
2. **Get ingestion token**
3. **Set up log forwarding**:
   - Use Render's log drain feature
   - Or use Winston transport

### Option 3: Papertrail

1. **Sign up** at https://www.papertrail.com
2. **Get log destination**
3. **Configure in Render** as log drain

## 5. Database Monitoring

### Render Database Monitoring

- View database metrics in Render dashboard
- Monitor:
  - Connection count
  - Query performance
  - Database size
  - CPU/Memory usage

### Custom Database Monitoring

Add to your application:
```typescript
// Monitor slow queries
// Monitor connection pool usage
// Alert on connection errors
```

## 6. Alert Configuration

### Critical Alerts (Set Up Immediately)

1. **Service Down**
   - Uptime monitoring (UptimeRobot/Pingdom)
   - Alert: Email + SMS

2. **High Error Rate**
   - Sentry alert: > 10 errors/minute
   - Alert: Email

3. **Database Connection Failures**
   - Application logs
   - Alert: Email

4. **High Response Time**
   - APM monitoring
   - Alert: > 5 seconds average

### Important Alerts

1. **Disk Space Low**
   - Render monitoring
   - Alert: < 20% free

2. **Memory Usage High**
   - Render monitoring
   - Alert: > 80% usage

3. **Backup Failures**
   - Backup script logs
   - Alert: Email on failure

## 7. Health Check Endpoint

Your application already has a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 12345,
  "memory": {
    "used": "50MB",
    "total": "512MB"
  }
}
```

Use this endpoint for:
- Uptime monitoring
- Load balancer health checks
- Automated testing

## 8. Metrics Dashboard

### Option 1: Render Dashboard

- Built-in metrics
- CPU, Memory, Response time
- Request count

### Option 2: Custom Dashboard

Create a metrics endpoint:
```typescript
GET /api/metrics
```

Return:
- Request count
- Error rate
- Average response time
- Active users
- Database query time

## 9. Recommended Monitoring Stack

### Free Tier

- **Error Tracking**: Sentry (free tier: 5,000 events/month)
- **Uptime**: UptimeRobot (free: 50 monitors)
- **Logs**: Render built-in logs
- **Metrics**: Render dashboard

### Paid Tier

- **Error Tracking**: Sentry (paid for more events)
- **Uptime**: Pingdom or UptimeRobot Pro
- **APM**: New Relic or Sentry Performance
- **Logs**: Logtail or Papertrail
- **Metrics**: Custom dashboard + Grafana

## 10. Quick Setup Checklist

- [ ] Set up Sentry account and configure DSN
- [ ] Install @sentry/node: `npm install @sentry/node`
- [ ] Set SENTRY_DSN environment variable
- [ ] Set up UptimeRobot monitor for health endpoint
- [ ] Configure email alerts in UptimeRobot
- [ ] Test health endpoint manually
- [ ] Set up Sentry alerts for critical errors
- [ ] Verify logs are accessible in Render
- [ ] Test backup script and set up alerts
- [ ] Document alert escalation procedures

## 11. Alert Response Procedures

### Service Down

1. Check Render dashboard for service status
2. Check recent deployments
3. Review error logs
4. Check database connectivity
5. Restart service if needed

### High Error Rate

1. Check Sentry for error details
2. Identify error pattern
3. Check recent code changes
4. Review application logs
5. Fix and deploy hotfix if critical

### Database Issues

1. Check database status in Render
2. Review connection pool usage
3. Check for slow queries
4. Review database logs
5. Scale database if needed

---

**Last Updated:** December 26, 2025

