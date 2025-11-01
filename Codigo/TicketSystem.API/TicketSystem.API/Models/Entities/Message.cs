using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.Mail;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Entidade para mensagens/comunicações do ticket
    /// Conceito POO: Composição e Polimorfismo
    /// </summary>
    public class Message : BaseEntity
    {
        [Required]
        [StringLength(5000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public MessageType Type { get; set; }

        [Required]
        public bool IsInternal { get; set; } = false; // Notas internas não são visíveis ao cliente

        // Relacionamentos
        [Required]
        public int TicketId { get; set; }
        [ForeignKey("TicketId")]
        public virtual Ticket Ticket { get; set; } = null!;

        [Required]
        public int AuthorId { get; set; }
        [ForeignKey("AuthorId")]
        public virtual User Author { get; set; } = null!;

        // Para mensagens editadas
        public DateTime? EditedAt { get; set; }
        public string? OriginalContent { get; set; }

        // Uploads desabilitados: anexos removidos

        // Propriedades calculadas
        [NotMapped]
        public bool IsEdited => EditedAt.HasValue;

        [NotMapped]
        public string AuthorName => Author?.FullName ?? "Sistema";

        /// <summary>
        /// Editar mensagem (manter histórico)
        /// </summary>
        public void Edit(string newContent)
        {
            if (string.IsNullOrWhiteSpace(OriginalContent))
                OriginalContent = Content;

            Content = newContent;
            EditedAt = DateTime.UtcNow;
            SetUpdatedAt();
        }

        /// <summary>
        /// Verificar se o usuário pode ver esta mensagem
        /// Conceito POO: Encapsulamento de regras de negócio
        /// </summary>
        public bool IsVisibleToUser(User user)
        {
            // Mensagens internas só são visíveis para agentes e admins
            if (IsInternal)
            {
                return user.UserType == UserType.Agent || user.UserType == UserType.Admin;
            }

            // Mensagens públicas são visíveis para todos os envolvidos no ticket
            return user.CanAccessTicket(Ticket);
        }
    }
}
