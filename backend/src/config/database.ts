import { Pool } from 'pg';
import { config } from '../utils/env';
import { logger } from '../utils/logger';

// Support both DATABASE_URL (for Render/Heroku) and individual connection parameters
const poolConfig = config.db.url
  ? {
      connectionString: config.db.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.db.url.includes('render.com') || config.db.url.includes('amazonaws.com') 
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
      connectionTimeoutMillis: 2000,
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