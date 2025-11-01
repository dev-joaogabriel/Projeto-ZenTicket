using System.ComponentModel.DataAnnotations;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Classe concreta para agentes de suporte
    /// Conceito POO: Herança e Especialização
    /// </summary>
    public class Agent : User
    {
        [StringLength(100)]
        public string? Specialization { get; set; }

        [Range(1, 5)]
        public int Level { get; set; } = 1; // Júnior, Pleno, Sênior, etc.

        public bool IsAvailable { get; set; } = true;

        // Métricas do agente
        public int TotalAssignedTickets { get; set; } = 0;
        public int TotalResolvedTickets { get; set; } = 0;
        public double AverageResolutionTimeHours { get; set; } = 0;

        // Relacionamentos específicos
        public virtual ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();

        public Agent()
        {
            UserType = UserType.Agent;
        }

        /// <summary>
        /// Implementação específica para agentes
        /// Agente pode acessar tickets atribuídos a ele
        /// </summary>
        public override bool CanAccessTicket(Ticket ticket) => 
            ticket.AssignedAgentId == Id || UserType == UserType.Admin;

        /// <summary>
        /// Método para calcular taxa de resolução
        /// Conceito POO: Encapsulamento de lógica de negócio
        /// </summary>
        public double GetResolutionRate() =>
            TotalAssignedTickets > 0 ? (double)TotalResolvedTickets / TotalAssignedTickets * 100 : 0;

        /// <summary>
        /// Atribuir ticket ao agente
        /// </summary>
        public void AssignTicket()
        {
            TotalAssignedTickets++;
            SetUpdatedAt();
        }

        /// <summary>
        /// Marcar ticket como resolvido pelo agente
        /// </summary>
        public void ResolveTicket(double resolutionTimeHours)
        {
            TotalResolvedTickets++;
            AverageResolutionTimeHours = (AverageResolutionTimeHours * (TotalResolvedTickets - 1) + resolutionTimeHours) / TotalResolvedTickets;
            SetUpdatedAt();
        }
    }
}