# Database Setup and Migrations

This directory contains database migration files and utilities for managing the database schema.

## Structure

- `migrations/` - SQL migration files (executed in alphabetical order)
- `migrate.ts` - Migration runner utility
- `seed.ts` - Database seeding utilities
- `index.ts` - Exports for migration and seed functions

## Migration Files

Migrations are numbered sequentially and executed in order:

1. `001_create_users_table.sql` - User accounts table
2. `002_create_job_sites_table.sql` - Job sites/locations table
3. `003_create_entries_table.sql` - Entry/exit records table
4. `004_create_photos_table.sql` - Photo files table
5. `005_create_watchlist_table.sql` - Watchlist/blacklist table
6. `006_create_audit_logs_table.sql` - Audit trail table
7. `007_create_hr_documents_table.sql` - HR documents table
8. `008_create_document_assignments_table.sql` - Document assignments table
9. `009_create_document_signatures_table.sql` - DocuSign signatures table
10. `010_create_docusign_webhook_events_table.sql` - DocuSign webhook events table
11. `011_add_updated_at_triggers.sql` - Automatic timestamp update triggers

## Usage

### Running Migrations

Run all pending migrations:
```bash
npm run db:migrate
```

### Seeding Database

Seed initial admin user and test data:
```bash
npm run db:seed
```

### Complete Setup

Run migrations and seed in one command:
```bash
npm run db:setup
```

## Migration System

The migration system:
- Tracks executed migrations in a `migrations` table
- Executes migrations in alphabetical order
- Uses transactions for each migration (rolls back on error)
- Prevents duplicate execution of migrations
- Automatically creates the migrations tracking table if it doesn't exist

## Seeding

The seed script creates:
- **Admin User**: Default admin account (username: `admin`, password: `admin123` or from `ADMIN_DEFAULT_PASSWORD` env var)
- **Test Data** (development only):
  - Test job site
  - Test guard user

⚠️ **Important**: Change the default admin password after first login!

## Environment Variables

Required for database operations:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `ADMIN_DEFAULT_PASSWORD` - Optional: Default admin password (default: admin123)

## Manual Database Setup

If you need to set up the database manually:

1. Create the database:
```sql
CREATE DATABASE security_access_db;
```

2. Run migrations using the npm script or manually execute SQL files in order.

3. Seed initial data using the npm script.

## Notes

- Migrations are idempotent (safe to run multiple times)
- The migrations table is automatically created on first run
- All migrations use `IF NOT EXISTS` where appropriate
- Foreign key constraints ensure referential integrity
- Indexes are created for frequently queried columns














