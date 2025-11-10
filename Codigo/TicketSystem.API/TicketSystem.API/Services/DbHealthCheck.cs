using Microsoft.Extensions.Diagnostics.HealthChecks;
using TicketSystem.API.Data;

namespace TicketSystem.API.Services
{
    public class DbHealthCheck : IHealthCheck
    {
        private readonly IServiceProvider _serviceProvider;

        public DbHealthCheck(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetService<ApplicationDbContext>();
                if (db == null)
                    return HealthCheckResult.Unhealthy("ApplicationDbContext not registered");

                var canConnect = await db.Database.CanConnectAsync(cancellationToken);
                return canConnect ? HealthCheckResult.Healthy("Database reachable") : HealthCheckResult.Unhealthy("Cannot connect to database");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy(ex.Message);
            }
        }
    }
}
