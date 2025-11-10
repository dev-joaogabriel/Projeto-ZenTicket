-- list_users_columns.sql
-- Purpose: inventory columns in dbo.Users and run quick usage checks for suspected legacy columns.
-- Run with sqlcmd or via SSMS / Azure Data Studio.

PRINT 'Listing columns in dbo.Users';

SELECT
    c.column_id,
    c.name AS ColumnName,
    ty.name AS TypeName,
    c.max_length,
    c.is_nullable,
    c.is_identity
FROM sys.columns c
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.Users')
ORDER BY c.column_id;

PRINT '---- Quick checks for common suspect columns ----';

-- Helper: will only run checks if the column exists

IF COL_LENGTH('dbo.Users', 'DepartmentId') IS NOT NULL
BEGIN
    PRINT 'DepartmentId: non-null count and sample values';
    SELECT COUNT(*) AS NonNullCount
    FROM dbo.Users
    WHERE DepartmentId IS NOT NULL;
    SELECT TOP (10)
        DepartmentId, COUNT(*) AS Cnt
    FROM dbo.Users
    GROUP BY DepartmentId
    ORDER BY Cnt DESC;
END
ELSE
    PRINT 'DepartmentId: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'CanManageUsers') IS NOT NULL
BEGIN
    PRINT 'CanManageUsers: counts (true/false/null)';
    SELECT
        SUM(CASE WHEN CanManageUsers = 1 THEN 1 ELSE 0 END) AS TrueCount,
        SUM(CASE WHEN CanManageUsers = 0 THEN 1 ELSE 0 END) AS FalseCount,
        SUM(CASE WHEN CanManageUsers IS NULL THEN 1 ELSE 0 END) AS NullCount
    FROM dbo.Users;
END
ELSE
    PRINT 'CanManageUsers: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'CanManageSystem') IS NOT NULL
BEGIN
    PRINT 'CanManageSystem: counts (true/false/null)';
    SELECT
        SUM(CASE WHEN CanManageSystem = 1 THEN 1 ELSE 0 END) AS TrueCount,
        SUM(CASE WHEN CanManageSystem = 0 THEN 1 ELSE 0 END) AS FalseCount,
        SUM(CASE WHEN CanManageSystem IS NULL THEN 1 ELSE 0 END) AS NullCount
    FROM dbo.Users;
END
ELSE
    PRINT 'CanManageSystem: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'CanViewReports') IS NOT NULL
BEGIN
    PRINT 'CanViewReports: counts (true/false/null)';
    SELECT
        SUM(CASE WHEN CanViewReports = 1 THEN 1 ELSE 0 END) AS TrueCount,
        SUM(CASE WHEN CanViewReports = 0 THEN 1 ELSE 0 END) AS FalseCount,
        SUM(CASE WHEN CanViewReports IS NULL THEN 1 ELSE 0 END) AS NullCount
    FROM dbo.Users;
END
ELSE
    PRINT 'CanViewReports: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'CanManageDepartments') IS NOT NULL
BEGIN
    PRINT 'CanManageDepartments: counts (true/false/null)';
    SELECT
        SUM(CASE WHEN CanManageDepartments = 1 THEN 1 ELSE 0 END) AS TrueCount,
        SUM(CASE WHEN CanManageDepartments = 0 THEN 1 ELSE 0 END) AS FalseCount,
        SUM(CASE WHEN CanManageDepartments IS NULL THEN 1 ELSE 0 END) AS NullCount
    FROM dbo.Users;
END
ELSE
    PRINT 'CanManageDepartments: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'TotalAssignedTickets') IS NOT NULL
BEGIN
    PRINT 'TotalAssignedTickets: stats';
    SELECT MIN(TotalAssignedTickets) AS MinVal, MAX(TotalAssignedTickets) AS MaxVal, AVG(CAST(TotalAssignedTickets AS FLOAT)) AS AvgVal
    FROM dbo.Users;
    SELECT TOP (10)
        Id, TotalAssignedTickets
    FROM dbo.Users
    WHERE TotalAssignedTickets IS NOT NULL
    ORDER BY TotalAssignedTickets DESC;
END
ELSE
    PRINT 'TotalAssignedTickets: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'TotalResolvedTickets') IS NOT NULL
BEGIN
    PRINT 'TotalResolvedTickets: stats';
    SELECT MIN(TotalResolvedTickets) AS MinVal, MAX(TotalResolvedTickets) AS MaxVal, AVG(CAST(TotalResolvedTickets AS FLOAT)) AS AvgVal
    FROM dbo.Users;
    SELECT TOP (10)
        Id, TotalResolvedTickets
    FROM dbo.Users
    WHERE TotalResolvedTickets IS NOT NULL
    ORDER BY TotalResolvedTickets DESC;
END
ELSE
    PRINT 'TotalResolvedTickets: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'AverageResolutionTimeHours') IS NOT NULL
BEGIN
    PRINT 'AverageResolutionTimeHours: stats';
    SELECT MIN(AverageResolutionTimeHours) AS MinVal, MAX(AverageResolutionTimeHours) AS MaxVal, AVG(CAST(AverageResolutionTimeHours AS FLOAT)) AS AvgVal
    FROM dbo.Users;
    SELECT TOP (10)
        Id, AverageResolutionTimeHours
    FROM dbo.Users
    WHERE AverageResolutionTimeHours IS NOT NULL
    ORDER BY AverageResolutionTimeHours DESC;
END
ELSE
    PRINT 'AverageResolutionTimeHours: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'TotalTickets') IS NOT NULL
BEGIN
    PRINT 'TotalTickets (Customer): stats';
    SELECT MIN(TotalTickets) AS MinVal, MAX(TotalTickets) AS MaxVal, AVG(CAST(TotalTickets AS FLOAT)) AS AvgVal
    FROM dbo.Users;
    SELECT TOP (10)
        Id, TotalTickets
    FROM dbo.Users
    WHERE TotalTickets IS NOT NULL
    ORDER BY TotalTickets DESC;
END
ELSE
    PRINT 'TotalTickets: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'LastTicketDate') IS NOT NULL
BEGIN
    PRINT 'LastTicketDate: sample non-null values';
    SELECT TOP (10)
        Id, LastTicketDate
    FROM dbo.Users
    WHERE LastTicketDate IS NOT NULL
    ORDER BY LastTicketDate DESC;
END
ELSE
    PRINT 'LastTicketDate: column does not exist on dbo.Users';

IF COL_LENGTH('dbo.Users', 'IsDeleted') IS NOT NULL
BEGIN
    PRINT 'IsDeleted counts';
    SELECT SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) AS DeletedCount, SUM(CASE WHEN IsDeleted = 0 THEN 1 ELSE 0 END) AS NotDeletedCount
    FROM dbo.Users;
END
ELSE
    PRINT 'IsDeleted: column does not exist on dbo.Users';

PRINT '---- End of script ----';
