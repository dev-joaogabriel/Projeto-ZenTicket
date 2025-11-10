-- Script para registrar migrations já aplicadas no banco
-- Uso: executar com sqlcmd ou através do SSMS. Faz INSERT condicional em __EFMigrationsHistory
-- ATENCAO: sempre faça backup do banco antes de executar scripts que alteram metadata

SET NOCOUNT ON;

IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NULL
BEGIN
    PRINT 'Criando tabela __EFMigrationsHistory (inexistente)';
    CREATE TABLE [__EFMigrationsHistory]
    (
        [MigrationId] nvarchar(150) NOT NULL PRIMARY KEY,
        [ProductVersion] nvarchar(32) NOT NULL
    );
END

-- Lista de migrations presentes no projeto que devemos marcar como aplicadas.
-- Atualize/nova entradas caso tenha mais migrations.

IF NOT EXISTS (SELECT 1
FROM [__EFMigrationsHistory]
WHERE MigrationId = '20251031205629_RemoveUsers_DepartmentId')
BEGIN
    PRINT 'Inserindo migration 20251031205629_RemoveUsers_DepartmentId';
    INSERT INTO [__EFMigrationsHistory]
        (MigrationId, ProductVersion)
    VALUES
        ('20251031205629_RemoveUsers_DepartmentId', '8.0.13');
END
ELSE
BEGIN
    PRINT 'Migration 20251031205629_RemoveUsers_DepartmentId já está registrada.';
END

PRINT 'Pronto.';
