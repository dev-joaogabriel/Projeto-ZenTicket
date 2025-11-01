using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Entidade principal do sistema - Ticket
    /// Conceito POO: Composição, Agregação e Estado
    /// Implementa conceitos de Domain Driven Design
    /// </summary>
    public class Ticket : BaseEntity
    {
        [Required]
        [StringLength(20)]
        public string Number { get; set; } = string.Empty; // Ex: TCK-2024-001

        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public TicketStatus Status { get; set; } = TicketStatus.Open;

        [Required]
        public TicketPriority Priority { get; set; } = TicketPriority.Normal;

        // Relacionamentos - Conceito POO: Composição e Agregação
        [Required]
        public int CustomerId { get; set; }
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; } = null!;


        public int? AssignedAgentId { get; set; }
        [ForeignKey("AssignedAgentId")]
        public virtual Agent? AssignedAgent { get; set; }

        [Required]
        public int DepartmentId { get; set; }
        [ForeignKey("DepartmentId")]
        public virtual Department Department { get; set; } = null!;

        // Timestamps importantes para SLA
        public DateTime? FirstResponseAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }

        // SLA em horas
        public int? SlaHours { get; set; }

        // Avaliação do cliente (1-5 estrelas)
        [Range(1, 5)]
        public int? CustomerRating { get; set; }

        [StringLength(500)]
        public string? CustomerFeedback { get; set; }

        // Relacionamentos de coleção
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
        // Uploads desabilitados: anexos removidos

        [NotMapped]
        public bool IsOverdue => SlaHours.HasValue &&
                                DateTime.UtcNow > CreatedAt.AddHours(SlaHours.Value) &&
                                Status != TicketStatus.Closed &&
                                Status != TicketStatus.Resolved;

        [NotMapped]
        public double? ResolutionTimeHours => ResolvedAt.HasValue ?
            (ResolvedAt.Value - CreatedAt).TotalHours : null;

        [NotMapped]
        public double? FirstResponseTimeHours => FirstResponseAt.HasValue ?
            (FirstResponseAt.Value - CreatedAt).TotalHours : null;

        [NotMapped]
        public int MessageCount => Messages.Count;

        public bool ChangeStatus(TicketStatus newStatus, int? userId = null)
        {
            if (!IsValidStatusTransition(Status, newStatus))
                return false;

            Status = newStatus;

            switch (newStatus)
            {
                case TicketStatus.Resolved:
                    ResolvedAt = DateTime.UtcNow;
                    break;
                case TicketStatus.Closed:
                    ClosedAt = DateTime.UtcNow;
                    if (!ResolvedAt.HasValue)
                        ResolvedAt = DateTime.UtcNow;
                    break;
            }

            SetUpdatedAt();
            return true;
        }

        public void AssignToAgent(int agentId)
        {
            AssignedAgentId = agentId;
            if (Status == TicketStatus.Open)
                Status = TicketStatus.InProgress;
            SetUpdatedAt();
        }

        public void SetFirstResponse()
        {
            if (!FirstResponseAt.HasValue)
            {
                FirstResponseAt = DateTime.UtcNow;
                SetUpdatedAt();
            }
        }

        public void Rate(int rating, string? feedback = null)
        {
            if (rating >= 1 && rating <= 5)
            {
                CustomerRating = rating;
                CustomerFeedback = feedback;
                SetUpdatedAt();
            }
        }

        private bool IsValidStatusTransition(TicketStatus from, TicketStatus to)
        {
            return (from, to) switch
            {
                (TicketStatus.Open, TicketStatus.InProgress) => true,
                (TicketStatus.Open, TicketStatus.Cancelled) => true,
                (TicketStatus.InProgress, TicketStatus.WaitingCustomer) => true,
                (TicketStatus.InProgress, TicketStatus.WaitingAgent) => true,
                (TicketStatus.InProgress, TicketStatus.Resolved) => true,
                (TicketStatus.InProgress, TicketStatus.Cancelled) => true,
                (TicketStatus.WaitingCustomer, TicketStatus.InProgress) => true,
                (TicketStatus.WaitingCustomer, TicketStatus.Cancelled) => true,
                (TicketStatus.WaitingAgent, TicketStatus.InProgress) => true,
                (TicketStatus.WaitingAgent, TicketStatus.Cancelled) => true,
                (TicketStatus.Resolved, TicketStatus.Closed) => true,
                (TicketStatus.Resolved, TicketStatus.InProgress) => true,
                (_, TicketStatus.Cancelled) => true,
                _ => false
            };
        }

        public static string GenerateTicketNumber()
        {
            var year = DateTime.Now.Year;
            var timestamp = DateTime.Now.ToString("MMddHHmmss");
            return $"TCK-{year}-{timestamp}";
        }
    }
}
