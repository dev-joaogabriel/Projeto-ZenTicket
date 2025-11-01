using System.ComponentModel.DataAnnotations;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Classe base abstrata para todas as entidades
    /// Conceito POO: Abstração e Template Method Pattern
    /// </summary>
    public abstract class BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Método virtual para ser sobrescrito nas classes filhas
        /// Conceito POO: Polimorfismo
        /// </summary>
        public virtual void SetUpdatedAt()
        {
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Soft Delete Pattern
        /// </summary>
        public virtual void SoftDelete()
        {
            IsDeleted = true;
            SetUpdatedAt();
        }
    }
}