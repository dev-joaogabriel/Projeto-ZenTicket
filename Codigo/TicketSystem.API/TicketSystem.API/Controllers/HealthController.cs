using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public HealthController(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Get()
        {
            return Ok(new
            {
                Status = "OK",
                App = _config["Application:Name"] ?? "Ticket System API",
                Version = _config["Application:Version"] ?? "1.0.0",
                Environment = _config["Application:Environment"] ?? "Development",
                Time = DateTime.UtcNow
            });
        }

        [HttpGet("db")]
        [AllowAnonymous]
        public async Task<IActionResult> Db()
        {
            try
            {
                var canConnect = await _db.Database.CanConnectAsync();
                int users = 0, admins = 0, customers = 0, agents = 0, departments = 0, tickets = 0;
                string? provider = _db.Database.ProviderName;

                if (canConnect)
                {
                    users = await _db.Users.CountAsync();
                    admins = await _db.Admins.CountAsync();
                    customers = await _db.Customers.CountAsync();
                    agents = await _db.Agents.CountAsync();
                    departments = await _db.Departments.CountAsync();
                    tickets = await _db.Tickets.CountAsync();
                }

                return Ok(new
                {
                    Connected = canConnect,
                    Provider = provider,
                    Counts = new
                    {
                        Users = users,
                        Admins = admins,
                        Customers = customers,
                        Agents = agents,
                        Departments = departments,
                        Tickets = tickets
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "DB check failed", Error = ex.Message });
            }
        }
    }
}
