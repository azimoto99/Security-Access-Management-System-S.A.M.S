import { logger } from './logger';
import { AppError } from '../middleware/errorHandler';
import { config } from './env';

// Lazy load Sentry to avoid requiring it if not configured
let Sentry: any = null;
let sentryInitialized = false;

/**
 * Initialize Sentry if DSN is configured
 */
const initializeSentry = (): void => {
  if (sentryInitialized || !config.sentry.dsn) {
    return;
  }

  try {
    // Dynamic import to avoid requiring @sentry/node if not used
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentryModule = require('@sentry/node');
    Sentry = sentryModule;

    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment || config.env,
      tracesSampleRate: config.env === 'production' ? 0.1 : 1.0, // 10% of transactions in production
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });

    sentryInitialized = true;
    logger.info('Sentry error tracking initialized');
  } catch (error) {
    logger.warn('Failed to initialize Sentry. Install @sentry/node for error tracking:', error);
  }
};

/**
 * Error tracking and reporting
 * Integrates with Sentry if configured
 */

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Track and log error with context
 */
export const trackError = (error: Error | AppError, context?: ErrorContext): void => {
  const isAppError = 'statusCode' in error || 'code' in error;
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...(isAppError && {
      statusCode: (error as AppError).statusCode,
      code: (error as AppError).code,
    }),
    context,
    timestamp: new Date().toISOString(),
  };

  // Log error
  logger.error('Error tracked', errorInfo);

  // Send to Sentry if configured
  if (config.sentry.dsn) {
    initializeSentry();
    if (Sentry) {
      try {
        Sentry.captureException(error, {
          extra: context,
          tags: {
            errorCode: isAppError ? (error as AppError).code : undefined,
            statusCode: isAppError ? (error as AppError).statusCode : undefined,
          },
        });
      } catch (sentryError) {
        logger.warn('Failed to send error to Sentry:', sentryError);
      }
    }
  }
};

/**
 * Track unhandled promise rejections
 */
export const setupErrorHandlers = (): void => {
  // Initialize Sentry early if configured
  if (config.sentry.dsn) {
    initializeSentry();
  }

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    trackError(reason instanceof Error ? reason : new Error(String(reason)), {
      type: 'unhandledRejection',
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    trackError(error, {
      type: 'uncaughtException',
    });
    // In production, exit the process after logging
    if (config.env === 'production') {
      // Give Sentry time to send the error
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
};


