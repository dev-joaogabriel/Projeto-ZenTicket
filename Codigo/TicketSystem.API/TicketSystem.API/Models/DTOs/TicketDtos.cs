using System.ComponentModel.DataAnnotations;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.DTOs
{
    public class TicketSummaryDto
    {
        public int Id { get; set; }
        public string Number { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public TicketStatus Status { get; set; }
        public TicketPriority Priority { get; set; }
        public string Department { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string? AssignedAgent { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsOverdue { get; set; }
        public int? SlaHours { get; set; }
        public int MessageCount { get; set; }
    }

    public class TicketDetailDto : TicketSummaryDto
    {
        public string Description { get; set; } = string.Empty;
        public double? ResolutionTimeHours { get; set; }
        public double? FirstResponseTimeHours { get; set; }
        public DateTime? FirstResponseAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public int? CustomerRating { get; set; }
        public string? CustomerFeedback { get; set; }
    }

    public class CreateTicketDto
    {
        [Required, StringLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required, StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public TicketPriority Priority { get; set; } = TicketPriority.Normal;

        [Required]
        public int DepartmentId { get; set; }

        // Opcional quando o criador for Admin/Agent
        public int? CustomerId { get; set; }
    }

    public class UpdateTicketStatusDto
    {
        [Required]
        public TicketStatus NewStatus { get; set; }
    }

    public class AssignTicketDto
    {
        [Required]
        public int AgentId { get; set; }
    }
}
