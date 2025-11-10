/*
  TicketSystemDB - Baseline de Estrutura (Schema Only)
  - Idempotente (usa IF NOT EXISTS)
  - Mínimo necessário e legível
  - Alinhado com o backend atual (Users sem DepartmentId; Attachments não incluído)

  Uso:
  1) Garanta que o banco exista (veja seção opcional abaixo) ou altere o USE.
  2) Execute este arquivo no SSMS.

  Observações:
  - Inclui índices essenciais (chaves, busca e unicidade).
  - Inclui DEFAULTs importantes (CreatedAt, IsDeleted, flags em Users).
  - Mantém FKs com CASCADE/SET NULL conforme o modelo atual.
*/

/* === (Opcional) Criar banco se não existir (sem caminhos fixos, mais portátil) ===
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'TicketSystemDB')
BEGIN
  PRINT 'Criando banco TicketSystemDB...';
  EXEC('CREATE DATABASE TicketSystemDB');
END
GO
*/

USE [TicketSystemDB];
GO

/* =====================================================================
   1) Tabelas
   ===================================================================== */

-- __EFMigrationsHistory (opcional para baseline EF)
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NULL
BEGIN
    PRINT 'Criando dbo.__EFMigrationsHistory';
    CREATE TABLE dbo.__EFMigrationsHistory
    (
        MigrationId nvarchar(150) NOT NULL,
        ProductVersion nvarchar(32) NOT NULL,
        CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY CLUSTERED (MigrationId)
    );
END
GO

-- Departments
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
    PRINT 'Criando dbo.Departments';
    CREATE TABLE dbo.Departments
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Departments PRIMARY KEY CLUSTERED,
        Name nvarchar(100) NOT NULL,
        Description nvarchar(500) NULL,
        IsActive bit NOT NULL,
        Color nvarchar(7) NULL,
        CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_Departments_CreatedAt DEFAULT (sysutcdatetime()),
        UpdatedAt datetime2(7) NULL,
        IsDeleted bit NOT NULL CONSTRAINT DF_Departments_IsDeleted DEFAULT (0)
    );
END
GO

-- Users (sem DepartmentId)
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    PRINT 'Criando dbo.Users';
    CREATE TABLE dbo.Users
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY CLUSTERED,
        FirstName nvarchar(100) NOT NULL,
        LastName nvarchar(100) NOT NULL,
        Email nvarchar(255) NOT NULL,
        PasswordHash nvarchar(255) NOT NULL,
        UserType int NOT NULL,
        IsActive bit NOT NULL,
        LastLoginAt datetime2(7) NULL,
        CanManageUsers bit NULL CONSTRAINT DF_Users_CanManageUsers DEFAULT (1),
        CanManageSystem bit NULL CONSTRAINT DF_Users_CanManageSystem DEFAULT (1),
        CanViewReports bit NULL CONSTRAINT DF_Users_CanViewReports DEFAULT (1),
        CanManageDepartments bit NULL CONSTRAINT DF_Users_CanManageDepartments DEFAULT (1),
        Specialization nvarchar(100) NULL,
        Level int NULL CONSTRAINT DF_Users_Level DEFAULT (1),
        IsAvailable bit NULL CONSTRAINT DF_Users_IsAvailable DEFAULT (1),
        TotalAssignedTickets int NULL,
        TotalResolvedTickets int NULL,
        AverageResolutionTimeHours float NULL,
        Department nvarchar(50) NULL,
        TotalTickets int NULL,
        LastTicketDate datetime2(7) NULL,
        CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (sysutcdatetime()),
        UpdatedAt datetime2(7) NULL,
        IsDeleted bit NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT (0)
    );
END
GO

-- Tickets
IF OBJECT_ID(N'dbo.Tickets', N'U') IS NULL
BEGIN
    PRINT 'Criando dbo.Tickets';
    CREATE TABLE dbo.Tickets
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tickets PRIMARY KEY CLUSTERED,
        Number nvarchar(20) NOT NULL,
        Subject nvarchar(200) NOT NULL,
        Description nvarchar(2000) NOT NULL,
        Status int NOT NULL,
        Priority int NOT NULL,
        CustomerId int NOT NULL,
        AssignedAgentId int NULL,
        DepartmentId int NOT NULL,
        FirstResponseAt datetime2(7) NULL,
        ResolvedAt datetime2(7) NULL,
        ClosedAt datetime2(7) NULL,
        SlaHours int NULL,
        CustomerRating int NULL,
        CustomerFeedback nvarchar(500) NULL,
        AdminId int NULL,
        AgentId int NULL,
        CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_Tickets_CreatedAt DEFAULT (sysutcdatetime()),
        UpdatedAt datetime2(7) NULL,
        IsDeleted bit NOT NULL CONSTRAINT DF_Tickets_IsDeleted DEFAULT (0)
    );
END
GO

-- Messages
IF OBJECT_ID(N'dbo.Messages', N'U') IS NULL
BEGIN
    PRINT 'Criando dbo.Messages';
    CREATE TABLE dbo.Messages
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Messages PRIMARY KEY CLUSTERED,
        Content nvarchar(max) NOT NULL,
        Type int NOT NULL,
        IsInternal bit NOT NULL,
        TicketId int NOT NULL,
        AuthorId int NOT NULL,
        EditedAt datetime2(7) NULL,
        OriginalContent nvarchar(max) NULL,
        CreatedAt datetime2(7) NOT NULL,
        UpdatedAt datetime2(7) NULL,
        IsDeleted bit NOT NULL
    );
END
GO

/* =====================================================================
   2) Índices (evita duplicidades — mantém apenas um unique por coluna)
   ===================================================================== */

-- Departments.Name único
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Departments') AND name = N'UX_Departments_Name')
BEGIN
    PRINT 'Criando índice único UX_Departments_Name';
    CREATE UNIQUE NONCLUSTERED INDEX UX_Departments_Name
    ON dbo.Departments (Name ASC);
END
GO

-- Users.Email único
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'IX_Users_Email')
BEGIN
    PRINT 'Criando índice único IX_Users_Email';
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_Email
    ON dbo.Users (Email ASC);
END
GO

-- Tickets.Number único
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'UX_Tickets_Number')
BEGIN
    PRINT 'Criando índice único UX_Tickets_Number';
    CREATE UNIQUE NONCLUSTERED INDEX UX_Tickets_Number
    ON dbo.Tickets (Number ASC);
END
GO

-- Tickets - índices de consulta
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_Status')
  CREATE NONCLUSTERED INDEX IX_Tickets_Status ON dbo.Tickets (Status ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_Priority')
  CREATE NONCLUSTERED INDEX IX_Tickets_Priority ON dbo.Tickets (Priority ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_CreatedAt')
  CREATE NONCLUSTERED INDEX IX_Tickets_CreatedAt ON dbo.Tickets (CreatedAt ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_DepartmentId')
  CREATE NONCLUSTERED INDEX IX_Tickets_DepartmentId ON dbo.Tickets (DepartmentId ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_CustomerId')
  CREATE NONCLUSTERED INDEX IX_Tickets_CustomerId ON dbo.Tickets (CustomerId ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_AssignedAgentId')
  CREATE NONCLUSTERED INDEX IX_Tickets_AssignedAgentId ON dbo.Tickets (AssignedAgentId ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_AdminId')
  CREATE NONCLUSTERED INDEX IX_Tickets_AdminId ON dbo.Tickets (AdminId ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Tickets') AND name = N'IX_Tickets_AgentId')
  CREATE NONCLUSTERED INDEX IX_Tickets_AgentId ON dbo.Tickets (AgentId ASC);
GO

-- Messages - índices de consulta
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Messages') AND name = N'IX_Messages_TicketId')
  CREATE NONCLUSTERED INDEX IX_Messages_TicketId ON dbo.Messages (TicketId ASC);
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Messages') AND name = N'IX_Messages_AuthorId')
  CREATE NONCLUSTERED INDEX IX_Messages_AuthorId ON dbo.Messages (AuthorId ASC);
GO

/* =====================================================================
   3) Chaves Estrangeiras
   ===================================================================== */

-- Tickets -> Departments
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Tickets_Departments_DepartmentId')
BEGIN
    ALTER TABLE dbo.Tickets WITH CHECK
    ADD CONSTRAINT FK_Tickets_Departments_DepartmentId
    FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments (Id);
    ALTER TABLE dbo.Tickets CHECK CONSTRAINT FK_Tickets_Departments_DepartmentId;
END
GO

-- Tickets -> Users (Customer)
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Tickets_Users_CustomerId')
BEGIN
    ALTER TABLE dbo.Tickets WITH CHECK
    ADD CONSTRAINT FK_Tickets_Users_CustomerId
    FOREIGN KEY (CustomerId) REFERENCES dbo.Users (Id);
    ALTER TABLE dbo.Tickets CHECK CONSTRAINT FK_Tickets_Users_CustomerId;
END
GO

-- Tickets -> Users (AssignedAgent) ON DELETE SET NULL
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Tickets_Users_AssignedAgentId')
BEGIN
    ALTER TABLE dbo.Tickets WITH CHECK
    ADD CONSTRAINT FK_Tickets_Users_AssignedAgentId
    FOREIGN KEY (AssignedAgentId) REFERENCES dbo.Users (Id)
    ON DELETE SET NULL;
    ALTER TABLE dbo.Tickets CHECK CONSTRAINT FK_Tickets_Users_AssignedAgentId;
END
GO

-- Tickets -> Users (Admin)
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Tickets_Users_AdminId')
BEGIN
    ALTER TABLE dbo.Tickets WITH CHECK
    ADD CONSTRAINT FK_Tickets_Users_AdminId
    FOREIGN KEY (AdminId) REFERENCES dbo.Users (Id);
    ALTER TABLE dbo.Tickets CHECK CONSTRAINT FK_Tickets_Users_AdminId;
END
GO

-- Tickets -> Users (Agent)
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Tickets_Users_AgentId')
BEGIN
    ALTER TABLE dbo.Tickets WITH CHECK
    ADD CONSTRAINT FK_Tickets_Users_AgentId
    FOREIGN KEY (AgentId) REFERENCES dbo.Users (Id);
    ALTER TABLE dbo.Tickets CHECK CONSTRAINT FK_Tickets_Users_AgentId;
END
GO

-- Messages -> Tickets (CASCADE)
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Messages_Tickets_TicketId')
BEGIN
    ALTER TABLE dbo.Messages WITH CHECK
    ADD CONSTRAINT FK_Messages_Tickets_TicketId
    FOREIGN KEY (TicketId) REFERENCES dbo.Tickets (Id)
    ON DELETE CASCADE;
    ALTER TABLE dbo.Messages CHECK CONSTRAINT FK_Messages_Tickets_TicketId;
END
GO

-- Messages -> Users (Author)
IF NOT EXISTS (SELECT 1
FROM sys.foreign_keys
WHERE name = N'FK_Messages_Users_AuthorId')
BEGIN
    ALTER TABLE dbo.Messages WITH CHECK
    ADD CONSTRAINT FK_Messages_Users_AuthorId
    FOREIGN KEY (AuthorId) REFERENCES dbo.Users (Id);
    ALTER TABLE dbo.Messages CHECK CONSTRAINT FK_Messages_Users_AuthorId;
END
GO

PRINT 'Baseline concluído.';
