import bcrypt from 'bcrypt';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../utils/env';

/**
 * Seed initial admin user
 */
export const seedAdminUser = async (): Promise<void> => {
  try {
    logger.info('Seeding initial admin user...');

    // Check if admin user already exists
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE username = 'admin'"
    );

    if (existingAdmin.rows.length > 0) {
      logger.info('Admin user already exists, skipping seed');
      return;
    }

    // Default admin credentials (should be changed after first login)
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, job_site_access, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role`,
      ['admin', passwordHash, 'admin', '[]', true]
    );

    logger.info('✓ Admin user created successfully');
    logger.warn(`Default credentials: username=admin, password=${defaultPassword}`);
    logger.warn('⚠️  Please change the default password after first login!');
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};

/**
 * Seed test data (for development only)
 */
export const seedTestData = async (): Promise<void> => {
  if (config.env === 'production') {
    logger.warn('Test data seeding skipped in production');
    return;
  }

  try {
    logger.info('Seeding test data...');

    // Create test job site
    const jobSiteResult = await pool.query(
      `INSERT INTO job_sites (name, address, contact_info, vehicle_capacity, visitor_capacity, truck_capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        'Main Construction Site',
        '123 Main Street, City, State 12345',
        JSON.stringify({ phone: '555-0100', email: 'site@example.com' }),
        50,
        100,
        20,
        true,
      ]
    );

    const jobSiteId = jobSiteResult.rows[0].id;
    logger.info(`✓ Test job site created: ${jobSiteId}`);

    // Create test guard user
    const guardPasswordHash = await bcrypt.hash('guard123', 10);
    const guardResult = await pool.query(
      `INSERT INTO users (username, password_hash, role, job_site_access, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username`,
      ['guard1', guardPasswordHash, 'guard', JSON.stringify([jobSiteId]), true]
    );

    logger.info(`✓ Test guard user created: ${guardResult.rows[0].username}`);

    logger.info('Test data seeding completed');
  } catch (error) {
    logger.error('Error seeding test data:', error);
    throw error;
  }
};

/**
 * Run all seed functions
 */
export const runSeeds = async (): Promise<void> => {
  try {
    await seedAdminUser();
    if (config.env === 'development') {
      await seedTestData();
    }
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
};

















