# Relatório técnico — Banco de Dados e Código (para entrega ao professor)

Este documento reúne informações extraídas do projeto a partir dos arquivos presentes no repositório.

5) Banco de dados: qual DB e como acessar
----------------------------------------
- Banco utilizado: Microsoft SQL Server (provider do Entity Framework Core: UseSqlServer).
- A aplicação está preparada para rodar contra:
  - Um SQL Server local (ex.: instance local, SQL Express ou LocalDB) ou
  - Um container Docker com SQL Server (ex.: `mcr.microsoft.com/mssql/server`) ou
  - Uma instância remota / nuvem (Azure SQL, etc.) desde que a connection string aponte para ela.

- Exemplos de connection strings encontrados no projeto:

  - `TicketSystem.API/.env.local.example` (exemplo para desenvolvimento local):

    ```text
    ConnectionStrings__DefaultConnection="Server=localhost;Database=TicketSystemDB;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
    ```sql
    -- Remover duplicata com caractere inválido caso exista (mantém o nome correto)
    IF EXISTS (SELECT 1
        FROM Departments
        WHERE Name = 'Suporte Técnico')
        AND EXISTS (SELECT 1
        FROM Departments
        WHERE Name = N'Suporte Técnico')
    BEGIN
        DELETE FROM Departments WHERE Name = 'Suporte Técnico';
    END
  - O projeto suporta execução local (conexão direta com o SQL Server na máquina ou via container) e pode ser apontado para um DB em nuvem alterando a connection string.
  - Arquivos de ambiente recomendados: copie `.env.local.example` para `.env.local` e ajuste a variável `ConnectionStrings__DefaultConnection`.
  - A documentação do projeto (`docs/LOCAL-SETUP.md`) descreve como rodar um container SQL Server e a string de conexão sugerida (`Server=127.0.0.1,1433;Database=TicketSystemDB;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;`).

6) Script completo de criação / seed do banco de dados
-----------------------------------------------------
O projeto contém dois arquivos SQL importantes para preparar/limpar o banco:

- `seed-data.sql` — insere departamentos (idempotente). O usuário admin é criado pelo app na inicialização:

```sql
-- Remover duplicata com caractere inválido caso exista (mantém o nome correto)
IF EXISTS (SELECT 1
    FROM Departments
    WHERE Name = 'Suporte Técnico')
    AND EXISTS (SELECT 1
    FROM Departments
    WHERE Name = N'Suporte Técnico')
BEGIN
    DELETE FROM Departments WHERE Name = 'Suporte Técnico';
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

-- (o arquivo continua inserindo outros departamentos...)

-- Observação: o admin (admin@ticketsystem.com / admin123) é criado em runtime
-- pelo DatabaseSeeder.Seed (Program.cs), para garantir hash BCrypt consistente.

```

- `reset-to-seed.sql` — limpa dados de runtime (tickets, messages, usuários não-admin) e reseeda identity:

```sql
-- reset-to-seed.sql
-- WARNING: Run only after taking a database backup. This script wipes tickets/messages and removes non-admin users,
-- then reseeds identity counters so you can re-run the existing seed-data.sql safely.

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

COMMIT TRANSACTION;

PRINT 'Reset complete. Now re-run seed-data.sql to repopulate departments/admin and any other seeds.';

```

> Observação: o projeto também executa o arquivo `seed-data.sql` automaticamente na inicialização (Program.cs) quando o provedor relacional está disponível.

8) Código fonte da classe de conexão com o Banco de dados (destacando a string de conexão)
---------------------------------------------------------------------------------

- A configuração de conexão ocorre em `Program.cs`, onde o `ApplicationDbContext` é registrado usando `UseSqlServer` com a connection string vinda da configuração:

```csharp
// Trecho de Program.cs (registro do DbContext)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null
            );
        });
    }
    else
    {
        options.UseInMemoryDatabase("DevDb");
    }
});
```

- Locais onde a string pode ser definida:
  - `appsettings.json` (exemplo presente no repositório) — veja `ConnectionStrings:DefaultConnection`.
  - Variáveis de ambiente com nome `ConnectionStrings__DefaultConnection` (usadas em `.env.local` / Docker).

- Classe `ApplicationDbContext` (fonte completa em `Data/ApplicationDbContext.cs`), responsável pelo EF Core `DbContext`:

```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Agent> Agents { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Department> Departments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Configurações de herança, entidades, índices e soft-delete
    }
}
```

9) Código fonte das classes que realizam o CRUD / APIs para consumo dos dados
-----------------------------------------------------------------------------

O projeto expõe controllers Web API que realizam as operações CRUD via HTTP. Abaixo estão os principais controllers (código extraído do repositório):

- `Controllers/TicketsController.cs` (operações sobre chamados: listar, obter por id, criar, atualizar status, atribuir):

```csharp
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public TicketsController(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET /api/tickets?status=&priority=&q=&page=1&pageSize=20
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetTickets([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] int? status = null, [FromQuery] int? priority = null, [FromQuery] string? q = null)
        {
            // implementação completa no repositório
        }

        // GET /api/tickets/{id}
        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id) { /* ... */ }

        // POST /api/tickets
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateTicketDto dto) { /* ... */ }

        // PUT /api/tickets/{id}/status
        [HttpPut("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTicketStatusDto dto) { /* ... */ }

        // PUT /api/tickets/{id}/assign
        [HttpPut("{id:int}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignTicketDto dto) { /* ... */ }
    }
}
```

- `Controllers/UsersController.cs` (CRUD de usuários e endpoint `/api/users/customers`):

```csharp
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public UsersController(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: /api/users
        [HttpGet]
        public async Task<IActionResult> GetAll(...) { /* ... */ }

        // POST: /api/users
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto) { /* ... */ }

        // GET: /api/users/customers
        [HttpGet("customers")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> GetCustomers(...) { /* ... */ }
    }
}
```

- `Controllers/DepartmentsController.cs` (lista departamentos):

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public DepartmentsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/departments
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll() { /* ... */ }
    }
}
```

---

Se quiser o PDF pronto para impressão ou que eu gere um arquivo `.txt` mais enxuto, eu posso criar e colocar em `docs/`.
