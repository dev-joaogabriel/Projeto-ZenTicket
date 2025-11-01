using System.ComponentModel.DataAnnotations;
using System.Net.Sockets;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Classe concreta para clientes
    /// Conceito POO: Herança e Especialização
    /// </summary>
    public class Customer : User
    {

        [StringLength(50)]
        public string? Department { get; set; }

        // Propriedades específicas do cliente
        public int TotalTickets { get; set; } = 0;
        public DateTime? LastTicketDate { get; set; }

        public Customer()
        {
            UserType = Enums.UserType.Customer;
        }

        /// <summary>
        /// Implementação do método abstrato da classe pai
        /// Cliente só pode acessar seus próprios tickets
        /// </summary>
        public override bool CanAccessTicket(Ticket ticket)
        {
            return ticket.CustomerId == this.Id;
        }

        /// <summary>
        /// Método específico do cliente
        /// Conceito POO: Especialização
        /// </summary>
        public void IncrementTicketCount()
        {
            TotalTickets++;
            LastTicketDate = DateTime.UtcNow;
            SetUpdatedAt();
        }
    }
}