using System.ComponentModel.DataAnnotations;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.DTOs
{
    public class CreateUserDto
    {
        [Required, StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6), StringLength(100)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserType UserType { get; set; } = UserType.Customer;

        // Campos opcionais por tipo
        public string? Department { get; set; } // Customer
        public string? Specialization { get; set; } // Agent
        public int? Level { get; set; } // Agent
        public bool? IsAvailable { get; set; } // Agent
        public bool IsActive { get; set; } = true;
    }
}
