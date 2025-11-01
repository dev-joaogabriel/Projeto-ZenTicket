using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Classe base abstrata para usuários
    /// Conceito POO: Herança e Polimorfismo
    /// Implementa Table Per Hierarchy (TPH) do EF Core
    /// </summary>
    [Table("Users")]
    public abstract class User : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserType UserType { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        public DateTime? LastLoginAt { get; set; }

        // Propriedade calculada - Conceito POO: Encapsulamento
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";

        // Navegação para tickets (será definida nas classes filhas conforme necessário)
        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

        /// <summary>
        /// Método abstrato - força implementação nas classes filhas
        /// Conceito POO: Abstração
        /// </summary>
        public abstract bool CanAccessTicket(Ticket ticket);

        /// <summary>
        /// Método virtual que pode ser sobrescrito
        /// </summary>
        public virtual void UpdateLastLogin()
        {
            LastLoginAt = DateTime.UtcNow;
            SetUpdatedAt();
        }
    }
}