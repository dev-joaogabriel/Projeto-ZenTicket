-- reset-to-seed.sql
-- WARNING: Run only after taking a database backup. This script wipes tickets/messages and removes non-admin users,
-- then reseeds identity counters so you can re-run the existing seed-data.sql safely.
-- Adjust paths / database names as needed. Run in SSMS or sqlcmd connected to the application database.

-- 1) OPTIONAL: Create a backup (uncomment and adjust file path if you have permissions)
-- BACKUP DATABASE [YourDatabaseName] TO DISK = N'C:\backups\tickets-backup.bak' WITH INIT;

BEGIN TRANSACTION;

-- Delete dependent tables first
PRINT 'Deleting Messages...';
DELETE FROM dbo.Messages;
DBCC CHECKIDENT('dbo.Messages', RESEED, 0);

PRINT 'Deleting Tickets...';
DELETE FROM dbo.Tickets;
DBCC CHECKIDENT('dbo.Tickets', RESEED, 0);

-- Remove non-admin users (keeps admin@ticketsystem.com)
PRINT 'Removing non-admin users...';
DELETE FROM dbo.Users WHERE Email <> 'admin@ticketsystem.com';
DBCC CHECKIDENT('dbo.Users', RESEED, 1);

-- If you also want to reset Departments (optional), uncomment below
-- PRINT 'Resetting Departments...';
-- DELETE FROM dbo.Departments;
-- DBCC CHECKIDENT('dbo.Departments', RESEED, 0);

COMMIT TRANSACTION;

PRINT 'Reset complete. Now re-run seed-data.sql to repopulate Departments.';
PRINT 'Example (sqlcmd): sqlcmd -S <server> -d <db> -i "C:\path\to\seed-data.sql"';
PRINT 'Admin user (admin@ticketsystem.com / admin123) will be recreated automatically when the application starts (DatabaseSeeder).';

-- Note: This script intentionally does not create new user rows.
-- After running, run seed-data.sql (already present in the project folder) to restore Departments.
-- The admin user is created by the application at startup. If you cannot run the app,
-- you may create users via the API (/api/users) or temporarily enable a SQL seed for admin.
