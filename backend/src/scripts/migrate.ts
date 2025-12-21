import { runMigrations } from '../db/migrate';
import { logger } from '../utils/logger';

const main = async () => {
  try {
    await runMigrations();
    process.exit(0);
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
};

main();









