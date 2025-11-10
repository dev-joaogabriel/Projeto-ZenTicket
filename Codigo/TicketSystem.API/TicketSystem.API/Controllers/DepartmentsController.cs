using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;

namespace TicketSystem.API.Controllers
{
    /// <summary>
    /// Controller que expõe endpoints para obter informações sobre departamentos.
    /// </summary>
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

        /// <summary>
        /// Retorna a lista de departamentos ativos (sem deletados) ordenada por nome.
        /// </summary>
        /// <returns>Lista de departamentos (id e nome).</returns>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.Departments
                .AsNoTracking()
                .Where(d => !d.IsDeleted && d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            return Ok(new { Message = "Departamentos obtidos", Data = items });
        }
    }
}
