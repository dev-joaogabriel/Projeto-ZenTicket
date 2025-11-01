using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TicketSystem.API.Data;
using TicketSystem.API.Models.Entities;

namespace TicketSystem.API.Tests;

/// <summary>
/// Shared helpers for integration tests to reduce duplication (client + auth token acquisition).
/// </summary>
public abstract class TestBase
{
    protected readonly CustomWebApplicationFactory Factory;

    protected TestBase(CustomWebApplicationFactory factory)
    {
        Factory = factory;
    }

    protected async Task<HttpClient> CreateAuthorizedClientAsync()
    {
        var client = Factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    protected async Task<string> GetAuthTokenAsync(HttpClient client)
    {
        async Task<string?> TryLoginAsync(string email)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "admin123" });
            if (!response.IsSuccessStatusCode) return null;
            var wrapperAttempt = await response.Content.ReadFromJsonAsync<AuthWrapper>();
            return wrapperAttempt?.Data?.Token;
        }

        var token = await TryLoginAsync("admin@test.com");
        if (token != null) return token;

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            void EnsureAdmin(string email)
            {
                if (!db.Admins.Any(a => a.Email == email))
                {
                    db.Admins.Add(new Admin
                    {
                        FirstName = "Administrador",
                        LastName = "Teste",
                        Email = email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            EnsureAdmin("admin@test.com");
            EnsureAdmin("admin@ticketsystem.com");
            db.SaveChanges();
        }

        token = await TryLoginAsync("admin@test.com") ?? await TryLoginAsync("admin@ticketsystem.com");
        if (token == null)
        {
            throw new InvalidOperationException("Failed to obtain auth token after seeding admin users.");
        }
        return token;
    }

    private sealed class AuthWrapper
    {
        public string? Message { get; set; }
        public AuthData? Data { get; set; }
    }
    private sealed class AuthData
    {
        public string? Token { get; set; }
    }
}
