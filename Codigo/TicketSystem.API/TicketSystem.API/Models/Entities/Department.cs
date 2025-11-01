using System.ComponentModel.DataAnnotations;
using System.Net.Sockets;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Entidade para departamentos/categorias de tickets
    /// Conceito POO: Composição e Agregação
    /// </summary>
    public class Department : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [StringLength(7)] // Para cores hexadecimais #FFFFFF
        public string? Color { get; set; }

        // Relacionamentos
        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public virtual ICollection<Agent> Agents { get; set; } = new List<Agent>(); // Agentes especializados

        /// <summary>
        /// Propriedade calculada para estatísticas
        /// Conceito POO: Encapsulamento
        /// </summary>
        public int ActiveTicketsCount => Tickets.Count(t => !t.IsDeleted &&
            (t.Status == Enums.TicketStatus.Open ||
             t.Status == Enums.TicketStatus.InProgress ||
             t.Status == Enums.TicketStatus.WaitingAgent ||
             t.Status == Enums.TicketStatus.WaitingCustomer));
    }
}
