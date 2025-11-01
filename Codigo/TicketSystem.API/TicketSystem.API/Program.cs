using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using TicketSystem.API.Configuration;
using TicketSystem.API.Data;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Services;
using TicketSystem.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
	.ReadFrom.Configuration(builder.Configuration)
	.Enrich.FromLogContext()
	.WriteTo.Console()
	.CreateLogger();
builder.Host.UseSerilog(Log.Logger);

// Load optional local appsettings overrides (for secrets like Gemini API key)
builder.Configuration
	.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
	.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.Local.json", optional: true, reloadOnChange: true);

// DbContext
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
		// Fallback amigável para DEV quando não houver conexão configurada
		options.UseInMemoryDatabase("DevDb");
	}
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// JWT Auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? "TicketSystem2024SuperSecretKeyForJWT!@#$%";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TicketSystemAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TicketSystemClient";

builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
	options.SaveToken = true;
	options.RequireHttpsMetadata = builder.Environment.IsDevelopment() ? false : true;
	options.TokenValidationParameters = new TokenValidationParameters
	{
		ValidateIssuer = true,
		ValidateAudience = true,
		ValidateLifetime = true,
		ValidateIssuerSigningKey = true,
		ValidIssuer = jwtIssuer,
		ValidAudience = jwtAudience,
		IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
		ClockSkew = TimeSpan.Zero
	};
});

builder.Services.AddAuthorization();

// DI
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient();

// CORS (configurable)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
	options.AddPolicy("DefaultCors", policy =>
	{
		if (builder.Environment.IsDevelopment())
		{
			// In Development, be maximally permissive to unblock mobile/WebView
			policy
				.SetIsOriginAllowed(_ => true)
				.AllowAnyHeader()
				.AllowAnyMethod();
		}
		else if (allowedOrigins.Length > 0)
		{
			policy.WithOrigins(allowedOrigins)
				  .AllowAnyHeader()
				  .AllowAnyMethod();
		}
		else
		{
			// Sensible fallback when not configured
			policy.WithOrigins("https://your-production-origin.example")
				  .AllowAnyHeader()
				  .AllowAnyMethod();
		}
	});
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
	options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
	{
		var key = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
		return RateLimitPartition.GetFixedWindowLimiter(
			partitionKey: key,
			factory: _ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = builder.Configuration.GetValue("RateLimiting:PermitLimit", 100),
				Window = TimeSpan.FromMinutes(builder.Configuration.GetValue("RateLimiting:WindowMinutes", 1)),
				QueueLimit = builder.Configuration.GetValue("RateLimiting:QueueLimit", 0),
				QueueProcessingOrder = QueueProcessingOrder.OldestFirst
			});
	});
	options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Controllers
builder.Services.AddControllers()
	.AddJsonOptions(options =>
	{
		// Serialize/deserialize enums as strings (e.g., "Open", "Urgent")
		options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
		// Keep default camelCase for property names to match frontend expectations (data, total, page...)
	})
	.ConfigureApiBehaviorOptions(options =>
{
	options.InvalidModelStateResponseFactory = context =>
	{
		var errors = context.ModelState
			.Where(e => e.Value?.Errors.Count > 0)
			.ToDictionary(
				kvp => kvp.Key,
				kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
			);

		var response = new { Message = "Dados inv?lidos", Errors = errors };
		return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(response);
	};
});

var app = builder.Build();

// Pipeline
app.UseSerilogRequestLogging();
// Em desenvolvimento, evitar redirecionamento HTTPS para facilitar testes no emulador Android (10.0.2.2)
if (!app.Environment.IsDevelopment())
{
	app.UseHttpsRedirection();
}
app.UseCors("DefaultCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Static frontend (optional)
var frontendPath = Path.Combine(app.Environment.ContentRootPath, "frontend");
if (Directory.Exists(frontendPath))
{
	var provider = new PhysicalFileProvider(frontendPath);
	var defaultFilesOptions = new DefaultFilesOptions
	{
		FileProvider = provider,
		DefaultFileNames = { "index.html" }
	};
	app.UseDefaultFiles(defaultFilesOptions);
	app.UseStaticFiles(new StaticFileOptions { FileProvider = provider, RequestPath = string.Empty });
}

// Basic security headers and error handling
app.Use(async (context, next) =>
{
	// Minimal hardening headers for APIs
	context.Response.Headers["X-Content-Type-Options"] = "nosniff";
	context.Response.Headers["X-Frame-Options"] = "DENY";
	context.Response.Headers["Referrer-Policy"] = "no-referrer";
	// Note: CSP omitted for API to avoid blocking legitimate responses; add if serving frontend here
	try
	{
		await next();
	}
	catch (Exception ex)
	{
		Log.Error(ex, "Unhandled exception");
		context.Response.ContentType = "application/json";
		context.Response.StatusCode = StatusCodes.Status500InternalServerError;
		var json = System.Text.Json.JsonSerializer.Serialize(new { Message = "Erro interno do servidor" });
		await context.Response.WriteAsync(json);
	}
});

app.MapControllers();

// DB ensure/create + seed
using (var scope = app.Services.CreateScope())
{
	var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
	try
	{
		var resetDb = app.Configuration.GetValue<bool>("Database:ResetOnStart", false);
		if (resetDb)
		{
			context.Database.EnsureDeleted();
			Console.WriteLine("Banco anterior removido.");
		}

		// Prefer migrations only when using a relational provider
		if (context.Database.IsRelational())
		{
			if (context.Database.GetMigrations().Any())
			{
				context.Database.Migrate();
			}
			else
			{
				context.Database.EnsureCreated();
			}
		}
		else
		{
			// InMemory / non-relational for tests or dev fallback
			context.Database.EnsureCreated();
		}
		Console.WriteLine("Banco de dados e tabelas OK.");

		if (!context.Departments.Any())
		{
			context.Departments.AddRange(
				new Department { Name = "Suporte Técnico", Description = "Problemas técnicos e bugs", Color = "#FF6B6B", IsActive = true, CreatedAt = DateTime.UtcNow },
				new Department { Name = "Financeiro", Description = "Pagamentos e faturamento", Color = "#4ECDC4", IsActive = true, CreatedAt = DateTime.UtcNow },
				new Department { Name = "Comercial", Description = "Produtos e vendas", Color = "#45B7D1", IsActive = true, CreatedAt = DateTime.UtcNow }
			);
			context.SaveChanges();
			Console.WriteLine("Departamentos inseridos.");
		}

		if (!context.Admins.Any())
		{
			context.Admins.Add(new Admin
			{
				FirstName = "Administrador",
				LastName = "Sistema",
				Email = "admin@ticketsystem.com",
				PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			});
			context.SaveChanges();
			Console.WriteLine("Admin criado (admin@ticketsystem.com / admin123).");
		}

		// Execute raw SQL seed file only for relational providers to avoid noisy errors in tests (InMemory)
		if (context.Database.IsRelational())
		{
			var seedPath = Path.Combine(app.Environment.ContentRootPath, "seed-data.sql");
			if (File.Exists(seedPath))
			{
				var sql = File.ReadAllText(seedPath);
				if (!string.IsNullOrWhiteSpace(sql))
				{
					context.Database.ExecuteSqlRaw(sql);
					Console.WriteLine("seed-data.sql executado.");
				}
			}
		}
	}
	catch (Exception ex)
	{
		Log.Error(ex, "Erro ao configurar BD");
	}
}

Log.Information("Ticket System API iniciada.");
Log.Information("Login padrão - Email: admin@ticketsystem.com | Senha: admin123");

app.Run();

// Expose Program for test host (partial class pattern)
public partial class Program { }
