    using System.ComponentModel;

namespace TicketSystem.API.Models.Enums
{
    /// <summary>
    /// Tipos de mensagem no sistema de tickets
    /// Extensibilidade para futuras funcionalidades
    /// </summary>
    public enum MessageType
    {
        [Description("Mensagem do Cliente")]
        CustomerMessage = 1,

        [Description("Mensagem do Agente")]
        AgentMessage = 2,

        [Description("Nota Interna")]
        InternalNote = 3,

        [Description("Mensagem do Sistema")]
        SystemMessage = 4
    }
}