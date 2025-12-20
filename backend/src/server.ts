import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './utils/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { webSocketService } from './services/websocketService';
import { setupErrorHandlers, trackError } from './utils/errorTracker';
import { startMetricsLogging } from './utils/monitoring';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize WebSocket service
webSocketService.initialize(wss);

// Setup error handlers
setupErrorHandlers();

// Start metrics logging (every 5 minutes in production)
if (config.env === 'production') {
  startMetricsLogging(5 * 60 * 1000);
}

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Apply general rate limiting to all API routes
app.use('/api', generalRateLimiter.middleware());

// API Routes
app.use('/api', routes);

// WebSocket service is initialized above

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`CORS origin: ${config.cors.origin}`);
});