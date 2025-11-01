-- Remover duplicata com caractere inválido caso exista (mantém o nome correto)
IF EXISTS (SELECT 1
    FROM Departments
    WHERE Name = 'Suporte T?cnico')
    AND EXISTS (SELECT 1
    FROM Departments
    WHERE Name = N'Suporte Técnico')
BEGIN
    DELETE FROM Departments WHERE Name = 'Suporte T?cnico';
END

-- Índice único para prevenir duplicatas de nome
IF NOT EXISTS (
    SELECT 1
FROM sys.indexes
WHERE name = 'UX_Departments_Name' AND object_id = OBJECT_ID('dbo.Departments')
)
BEGIN
    CREATE UNIQUE INDEX UX_Departments_Name ON dbo.Departments(Name);
END

-- Inserir Departamentos (idempotente, usando literais Unicode N'...')
IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Suporte Técnico')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Suporte Técnico', N'Problemas técnicos e bugs', N'#FF6B6B', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Financeiro')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Financeiro', N'Questões relacionadas a pagamentos e faturamento', N'#4ECDC4', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Comercial')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Comercial', N'Dúvidas sobre produtos e vendas', N'#45B7D1', 1, GETUTCDATE(), 0);
END

-- Extras recomendados
IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Infraestrutura/Redes')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Infraestrutura/Redes', N'Redes, VPN, DNS, servidores', N'#6C5CE7', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Sistemas/ERP')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Sistemas/ERP', N'ERP, integrações, customizações', N'#A29BFE', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'RH')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'RH', N'Admissão, desligamento, folha e benefícios', N'#55EFC4', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Operações')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Operações', N'PCP, logística, produção', N'#00CEC9', 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1
FROM Departments
WHERE Name = N'Jurídico')
BEGIN
    INSERT INTO Departments
        (Name, Description, Color, IsActive, CreatedAt, IsDeleted)
    VALUES
        (N'Jurídico', N'Contratos e compliance', N'#FAB1A0', 1, GETUTCDATE(), 0);
END

-- Inserir Admin (senha: admin123) - idempotente (checa por email)
IF NOT EXISTS (SELECT 1
FROM Users
WHERE Email = 'admin@ticketsystem.com')
BEGIN
    INSERT INTO Users
        (FirstName, LastName, Email, PasswordHash, UserType, IsActive, CreatedAt, IsDeleted, CanManageUsers, CanManageSystem, CanViewReports, CanManageDepartments)
    VALUES
        (N'Administrador', N'Sistema', 'admin@ticketsystem.com', '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 1, GETUTCDATE(), 0, 1, 1, 1, 1);
END