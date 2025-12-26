# Database Scripts

## Delete All Entries Script

This script deletes all entries (trucks, vehicles, and visitors) from the database while preserving users and all other database tables.

### ⚠️ WARNING
**This action cannot be undone. Make sure you have a backup before running!**

### What Gets Deleted
- ✅ All entries (trucks, vehicles, visitors)
- ✅ Associated photos from database (via CASCADE)
- ✅ Optionally: photo files from disk (if `--delete-files` flag is used)

### What is Preserved
- ✅ Users table
- ✅ Job sites table
- ✅ Audit logs table
- ✅ All other database tables

### Usage Options

#### Option 1: TypeScript Script (Recommended)
This script provides detailed logging and optional file deletion:

```bash
# Delete entries from database only (photos cascade delete automatically)
npx ts-node backend/src/db/scripts/deleteTruckEntries.ts

# Delete entries AND photo files from disk
npx ts-node backend/src/db/scripts/deleteTruckEntries.ts --delete-files
```

#### Option 2: SQL Script
Direct SQL execution:

```bash
# Using psql
psql $DATABASE_URL -f backend/src/db/scripts/delete_truck_entries.sql

# Or connect to your database and run the SQL file
psql -U your_user -d your_database -f backend/src/db/scripts/delete_truck_entries.sql
```

### What the Script Does

1. **Shows Statistics**: Displays count of entries by type (truck, vehicle, visitor) and status before deletion
2. **Deletes Entries**: Removes all entries from the `entries` table
3. **Cascade Deletes Photos**: Photos in the `photos` table are automatically deleted due to foreign key CASCADE constraint
4. **Optional File Deletion**: If `--delete-files` flag is used, also deletes photo files from disk
5. **Verifies**: Confirms all entries have been deleted

### Example Output

```
Starting entries deletion (trucks, vehicles, and visitors)...
Found 150 total entries:
  truck: 50 (Active: 5, Exited: 40, Emergency: 5)
  vehicle: 70 (Active: 10, Exited: 55, Emergency: 5)
  visitor: 30 (Active: 2, Exited: 25, Emergency: 3)
Found 200 photo IDs associated with entries
Successfully deleted 150 entries from database:
  - truck: 50
  - vehicle: 70
  - visitor: 30
Deleted 400 photo files from disk
✅ All entries have been successfully deleted
Entries deletion completed
```

### Notes

- The script is safe to run multiple times (it will just report "No entries found" if the database is already empty)
- Photo files on disk are NOT automatically deleted unless you use the `--delete-files` flag
- Users, job sites, and all other tables remain untouched

