using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Services.Interfaces;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _ai;

        public AiController(IAiService ai)
        {
            _ai = ai;
        }

        // POST /api/ai/analyze
        [HttpPost("analyze")]
        [Authorize]
        public async Task<IActionResult> Analyze([FromBody] AiAnalyzeRequest request, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Dados inválidos" });
            }

            var result = await _ai.AnalyzeAsync(request, ct);
            return Ok(new { Message = "Análise concluída", Data = result });
        }
    }
}
