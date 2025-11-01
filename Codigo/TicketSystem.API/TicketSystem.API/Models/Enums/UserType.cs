using System.ComponentModel;

namespace TicketSystem.API.Models.Enums
{
    /// <summary>
    /// Define os tipos de usuários do sistema
    /// Aplicação de conceitos POO: Encapsulamento de constantes
    /// </summary>
    public enum UserType
    {
        [Description("Cliente")]
        Customer = 1,

        [Description("Agente de Suporte")]
        Agent = 2,

        [Description("Administrador")]
        Admin = 3
    }
}