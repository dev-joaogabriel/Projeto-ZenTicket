using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.DTOs
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public MessageType Type { get; set; }
        public bool IsInternal { get; set; }
        public bool IsEdited { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
    }

    public class CreateMessageDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(5000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;
        public MessageType Type { get; set; } = MessageType.CustomerMessage;
        public bool IsInternal { get; set; } = false; // Só permitido para Agent/Admin
    }
}
