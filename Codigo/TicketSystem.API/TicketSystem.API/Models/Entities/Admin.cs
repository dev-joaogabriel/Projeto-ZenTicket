using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Models.Entities
{
    /// <summary>
    /// Classe concreta para administradores
    /// Conceito POO: Herança e Máximos Privilégios
    /// </summary>
    public class Admin : User
    {
        public bool CanManageUsers { get; set; } = true;
        public bool CanManageSystem { get; set; } = true;
        public bool CanViewReports { get; set; } = true;
        public bool CanManageDepartments { get; set; } = true;

        public Admin()
        {
            UserType = UserType.Admin;
        }

        /// <summary>
        /// Administrador pode acessar qualquer ticket
        /// Conceito POO: Polimorfismo - comportamento diferente da classe pai
        /// </summary>
        public override bool CanAccessTicket(Ticket ticket) => true;

        /// <summary>
        /// Método específico para administradores
        /// </summary>
        public bool HasPermission(string permission) =>
            permission switch
            {
                "ManageUsers" => CanManageUsers,
                "ManageSystem" => CanManageSystem,
                "ViewReports" => CanViewReports,
                "ManageDepartments" => CanManageDepartments,
                _ => false
            };
    }
}
