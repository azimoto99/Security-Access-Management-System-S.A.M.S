import { Pool } from 'pg';
import { config } from '../utils/env';
import { logger } from '../utils/logger';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool
  .query('SELECT NOW()')
  .then(() => {
    logger.info('Database connection test successful');
  })
  .catch((err) => {
    logger.error('Database connection test failed:', err);
  });

export default pool;