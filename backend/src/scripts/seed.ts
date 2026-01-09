import { runSeeds } from '../db/seed';
import { logger } from '../utils/logger';

const main = async () => {
  try {
    await runSeeds();
    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  }
};

main();

















