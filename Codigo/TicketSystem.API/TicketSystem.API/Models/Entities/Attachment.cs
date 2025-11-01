using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Entidade para anexos de tickets e mensagens
    /// Conceito POO: Composição
    /// </summary>
    public class Attachment : BaseEntity
    {
        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;

        [Required]
        public long FileSize { get; set; } // em bytes

        // Relacionamentos opcionais (pode estar ligado a ticket OU mensagem)
        public int? TicketId { get; set; }
        [ForeignKey("TicketId")]
        public virtual Ticket? Ticket { get; set; }

        public int? MessageId { get; set; }
        [ForeignKey("MessageId")]
        public virtual Message? Message { get; set; }

        [Required]
        public int UploadedById { get; set; }
        [ForeignKey("UploadedById")]
        public virtual User UploadedBy { get; set; } = null!;

        // Propriedades calculadas
        [NotMapped]
        public string FileSizeFormatted
        {
            get
            {
                if (FileSize < 1024) return $"{FileSize} B";
                if (FileSize < 1024 * 1024) return $"{FileSize / 1024:F1} KB";
                if (FileSize < 1024 * 1024 * 1024) return $"{FileSize / (1024 * 1024):F1} MB";
                return $"{FileSize / (1024 * 1024 * 1024):F1} GB";
            }
        }

        [NotMapped]
        public bool IsImage => ContentType.StartsWith("image/");

        [NotMapped]
        public bool IsDocument => ContentType.Contains("pdf") ||
                                 ContentType.Contains("word") ||
                                 ContentType.Contains("text");
    }
}