-- Script to delete all entries (trucks, vehicles, and visitors) from the database
-- This will also cascade delete associated photos from the photos table
-- WARNING: This action cannot be undone. Make sure you have a backup!
-- NOTE: This will NOT delete users or any other database tables

-- First, let's see how many entries we have by type
SELECT entry_type, COUNT(*) as count 
FROM entries 
GROUP BY entry_type
ORDER BY entry_type;

-- Show breakdown by status for each type
SELECT entry_type, status, COUNT(*) as count 
FROM entries 
GROUP BY entry_type, status
ORDER BY entry_type, status;

-- Delete all entries (trucks, vehicles, and visitors)
-- Photos will be automatically deleted due to ON DELETE CASCADE constraint
DELETE FROM entries;

-- Verify deletion
SELECT COUNT(*) as remaining_entries FROM entries;
SELECT entry_type, COUNT(*) as count 
FROM entries 
GROUP BY entry_type;

