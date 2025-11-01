using TicketSystem.API.Models.DTOs;

namespace TicketSystem.API.Services.Interfaces
{
    public interface IAiService
    {
        Task<AiAnalyzeResponse> AnalyzeAsync(AiAnalyzeRequest request, CancellationToken ct = default);
    }
}
