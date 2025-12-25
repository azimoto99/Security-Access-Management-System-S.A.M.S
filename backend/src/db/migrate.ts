import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

interface Migration {
  filename: string;
  path: string;
}

/**
 * Get all migration files sorted by filename
 */
const getMigrationFiles = (): Migration[] => {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return files.map((filename) => ({
    filename,
    path: path.join(MIGRATIONS_DIR, filename),
  }));
};

/**
 * Get list of already executed migrations
 */
const getExecutedMigrations = async (): Promise<string[]> => {
  try {
    // Check if migrations table exists, if not create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    return result.rows.map((row) => row.filename);
  } catch (error) {
    logger.error('Error getting executed migrations:', error);
    throw error;
  }
};

/**
 * Execute a single migration file
 */
const executeMigration = async (migration: Migration): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Read migration file
    const sql = fs.readFileSync(migration.path, 'utf8');

    // Execute migration
    await client.query(sql);

    // Record migration
    await client.query('INSERT INTO migrations (filename) VALUES ($1)', [migration.filename]);

    await client.query('COMMIT');
    logger.info(`✓ Executed migration: ${migration.filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`✗ Failed to execute migration: ${migration.filename}`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting database migrations...');

    const migrationFiles = getMigrationFiles();
    const executedMigrations = await getExecutedMigrations();

    const pendingMigrations = migrationFiles.filter(
      (migration) => !executedMigrations.includes(migration.filename)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Rollback last migration (for development only)
 */
export const rollbackLastMigration = async (): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].filename;
    logger.warn(`Rollback functionality not implemented. Last migration: ${lastMigration}`);
    logger.warn('Manual rollback required');
  } catch (error) {
    logger.error('Rollback failed:', error);
    throw error;
  }
};










