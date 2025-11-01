using System.Linq;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TicketSystem.API.Data;
using TicketSystem.API.Models.Entities;

namespace TicketSystem.API.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing ApplicationDbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add in-memory database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb");
            });

            // Build provider to seed
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();

            if (!db.Departments.Any())
            {
                db.Departments.Add(new Department { Name = "Teste", Description = "Dept Teste", Color = "#FFFFFF", IsActive = true, CreatedAt = DateTime.UtcNow });
                db.SaveChanges();
            }

            if (!db.Customers.Any())
            {
                db.Customers.Add(new Customer
                {
                    FirstName = "Cliente",
                    LastName = "Teste",
                    Email = "cliente@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("cliente123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
            }
        });
    }
}
