import { Pool } from 'pg';
import { config } from '../utils/env';
import { logger } from '../utils/logger';

// Support both DATABASE_URL (for Render/Heroku) and individual connection parameters
const isRenderDatabase = config.db.url?.includes('render.com') || config.db.host?.includes('render.com');
const isProduction = config.env === 'production';

const poolConfig = config.db.url
  ? {
      connectionString: config.db.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased to 10 seconds for Render
      ssl: isRenderDatabase || isProduction
        ? { rejectUnauthorized: false }
        : false,
    }
  : {
      host: config.db.host || 'localhost',
      port: config.db.port || 5432,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased to 10 seconds
      ssl: isRenderDatabase || isProduction
        ? { rejectUnauthorized: false }
        : false,
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup (non-blocking)
// This allows the server to start even if the initial connection test fails
// The connection will be retried when the first actual query is made
pool
  .query('SELECT NOW()')
  .then(() => {
    logger.info('Database connection test successful');
  })
  .catch((err) => {
    logger.warn('Database connection test failed (will retry on first query):', err.message);
    // Don't throw - allow server to start and retry connections on actual queries
  });

export default pool;