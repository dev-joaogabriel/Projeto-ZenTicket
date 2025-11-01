using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;
using Xunit;

namespace TicketSystem.API.Tests;

public class TicketsControllerTests : TestBase, IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public TicketsControllerTests(CustomWebApplicationFactory factory) : base(factory)
    {
        _factory = factory;
    }

    // Auth helpers moved to TestBase

    [Fact]
    public async Task GetTickets_Unauthorized_WithoutToken()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/tickets");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTickets_ReturnsEmptyList_WhenNoTickets()
    {
        var client = await CreateAuthorizedClientAsync();

        // Guarantee empty state: remove any tickets that may have been inserted by previous tests
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (db.Tickets.Any())
            {
                db.Tickets.RemoveRange(db.Tickets);
                db.SaveChanges();
            }
        }

        var resp = await client.GetAsync("/api/tickets");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var list = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        list.Should().NotBeNull();
        list!.Data.Total.Should().Be(0);
    }

    [Fact]
    public async Task CreateTicket_ValidPayload_CreatesAndReturns201()
    {
        var client = await CreateAuthorizedClientAsync();

        // Need existing department & customer
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();

            var create = new CreateTicketDto
            {
                Subject = "Teste de criação",
                Description = "Descrição de teste",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id
            };

            var resp = await client.PostAsJsonAsync("/api/tickets", create);
            resp.StatusCode.Should().Be(HttpStatusCode.Created);
            var created = await resp.Content.ReadFromJsonAsync<TicketCreatedWrapper>();
            created.Should().NotBeNull();
            created!.Message.Should().Contain("Ticket criado");
            created.Data.Subject.Should().Be("Teste de criação");
        }
    }

    [Fact]
    public async Task CreateTicket_MissingRequiredField_ReturnsBadRequest()
    {
        var client = await CreateAuthorizedClientAsync();

        var invalid = new { description = "Sem subject", priority = 1, departmentId = 1 };
        var resp = await client.PostAsJsonAsync("/api/tickets", invalid);
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AssignTicket_AdminOnly_ReturnsUnauthorizedForNoToken()
    {
        var client = _factory.CreateClient();
        var resp = await client.PutAsJsonAsync("/api/tickets/1/assign", new { agentId = 1 });
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AssignTicket_AdminWithToken_ButTicketMissing_ReturnsNotFound()
    {
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client); // token de admin
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var resp = await client.PutAsJsonAsync("/api/tickets/999/assign", new { agentId = 1 });
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetTicket_ById_NotFound()
    {
        var client = await CreateAuthorizedClientAsync();
        var resp = await client.GetAsync("/api/tickets/98765");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetTicket_ByNumber_Success()
    {
        var client = await CreateAuthorizedClientAsync();
        string createdNumber;
        int createdId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            var ticket = new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "ByNumberTest",
                Description = "Detalhe teste",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            };
            db.Tickets.Add(ticket);
            db.SaveChanges();
            createdNumber = ticket.Number;
            createdId = ticket.Id;
        }

        var resp = await client.GetAsync($"/api/tickets/by-number/{createdNumber}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketDetailWrapper>();
        json.Should().NotBeNull();
        json!.Data.Id.Should().Be(createdId);
        json.Data.Subject.Should().Be("ByNumberTest");
        json.Data.Description.Should().Be("Detalhe teste");
    }

    [Fact]
    public async Task GetTicket_ByNumber_NotFound()
    {
        var client = await CreateAuthorizedClientAsync();
        var resp = await client.GetAsync("/api/tickets/by-number/NAOEXISTE123");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetTickets_FilterByStatus_ReturnsOnlyMatching()
    {
        var client = await CreateAuthorizedClientAsync();

        // Seed two tickets with different status via API
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "A",
                Description = "A",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            });
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "B",
                Description = "B",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }

        var resp = await client.GetAsync("/api/tickets?status=" + (int)TicketStatus.Open);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        json.Should().NotBeNull();
        json!.Data.Total.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetTickets_SearchQuery_FiltersBySubject()
    {
        var client = await CreateAuthorizedClientAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "XptoEspecial",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }

        var resp = await client.GetAsync("/api/tickets?q=XptoEspecial");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        json.Should().NotBeNull();
        json!.Data.Total.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task AssignTicket_Admin_Success()
    {
        var client = await CreateAuthorizedClientAsync();

        int ticketId;
        int agentId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            var agent = new Agent
            {
                FirstName = "Agente",
                LastName = "Teste",
                Email = "agent@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("agent123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Agents.Add(agent);
            db.SaveChanges();
            agentId = agent.Id;

            var ticket = new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "AssignTest",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            };
            db.Tickets.Add(ticket);
            db.SaveChanges();
            ticketId = ticket.Id;
        }

        var resp = await client.PutAsJsonAsync($"/api/tickets/{ticketId}/assign", new { agentId });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_ValidTransition_Works()
    {
        var client = await CreateAuthorizedClientAsync();

        int ticketId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            var ticket = new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "StatusTest",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            };
            db.Tickets.Add(ticket);
            db.SaveChanges();
            ticketId = ticket.Id;
        }

        // First transition Open -> InProgress via status endpoint
        var resp = await client.PutAsJsonAsync($"/api/tickets/{ticketId}/status", new { newStatus = TicketStatus.InProgress });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_InvalidTransition_ReturnsBadRequest()
    {
        var client = await CreateAuthorizedClientAsync();

        int ticketId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            var ticket = new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "InvalidStatusTest",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            };
            db.Tickets.Add(ticket);
            db.SaveChanges();
            ticketId = ticket.Id;
        }

        // Open -> Resolved é inválido diretamente
        var resp = await client.PutAsJsonAsync($"/api/tickets/{ticketId}/status", new { newStatus = TicketStatus.Resolved });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTickets_Pagination_Works()
    {
        var client = await CreateAuthorizedClientAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            for (int i = 0; i < 35; i++)
            {
                db.Tickets.Add(new Ticket
                {
                    Number = Ticket.GenerateTicketNumber(),
                    Subject = "PageTest" + i,
                    Description = "Desc",
                    Priority = TicketPriority.Normal,
                    DepartmentId = dept.Id,
                    CustomerId = customer.Id,
                    Status = TicketStatus.Open,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i)
                });
            }
            db.SaveChanges();
        }

        var resp = await client.GetAsync("/api/tickets?page=2&pageSize=10");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        json.Should().NotBeNull();
        json!.Data.Page.Should().Be(2);
        json!.Data.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetTickets_FilterByPriority()
    {
        var client = await CreateAuthorizedClientAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "PriorityTest",
                Description = "Desc",
                Priority = TicketPriority.Urgent,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }

        var resp = await client.GetAsync("/api/tickets?priority=" + (int)TicketPriority.Urgent);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        json.Should().NotBeNull();
        json!.Data.Total.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetTickets_FilterCombined_StatusAndQuery()
    {
        var client = await CreateAuthorizedClientAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dept = db.Departments.First();
            var customer = db.Customers.First();
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "ComboMatch",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            });
            db.Tickets.Add(new Ticket
            {
                Number = Ticket.GenerateTicketNumber(),
                Subject = "Other",
                Description = "Desc",
                Priority = TicketPriority.Normal,
                DepartmentId = dept.Id,
                CustomerId = customer.Id,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }

        var resp = await client.GetAsync($"/api/tickets?status={(int)TicketStatus.InProgress}&q=ComboMatch");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await resp.Content.ReadFromJsonAsync<TicketsListWrapper>();
        json.Should().NotBeNull();
        json!.Data.Total.Should().Be(1);
    }

    [Fact]
    public async Task CreateTicket_InvalidDepartment_ReturnsBadRequest()
    {
        var client = await CreateAuthorizedClientAsync();
        var invalid = new { subject = "Teste", description = "Desc", priority = 1, departmentId = 99999, customerId = 1 };
        var resp = await client.PostAsJsonAsync("/api/tickets", invalid);
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // Helper DTOs matching controller anonymous response casing (PascalCase)
    private sealed class TicketsListWrapper
    {
        public string? Message { get; set; }
        public TicketsListData Data { get; set; } = new();
    }
    private sealed class TicketsListData
    {
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<object> Items { get; set; } = new();
    }

    private sealed class TicketCreatedWrapper
    {
        public string Message { get; set; } = string.Empty;
        public TicketCreatedData Data { get; set; } = new();
    }
    private sealed class TicketCreatedData
    {
        public int Id { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    private sealed class TicketDetailWrapper
    {
        public string Message { get; set; } = string.Empty;
        public TicketDetailData Data { get; set; } = new();
    }
    private sealed class TicketDetailData
    {
        public int Id { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
