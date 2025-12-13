import { logger } from './logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Error tracking and reporting
 * In production, this would integrate with services like Sentry, LogRocket, etc.
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

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: context });
    // For now, we'll just log it
  }
};

/**
 * Track unhandled promise rejections
 */
export const setupErrorHandlers = (): void => {
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
    // In production, you might want to exit the process
    // process.exit(1);
  });
};


