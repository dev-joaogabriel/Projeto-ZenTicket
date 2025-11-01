using System.ComponentModel;

namespace TicketSystem.API.Models.Enums
{
    /// <summary>
    /// Status dos tickets no sistema
    /// Representa o ciclo de vida do atendimento
    /// </summary>
    public enum TicketStatus    
    {
        [Description("Aberto")]
        Open = 1,

        [Description("Em Andamento")]
        InProgress = 2,

        [Description("Aguardando Cliente")]
        WaitingCustomer = 3,

        [Description("Aguardando Agente")]
        WaitingAgent = 4,

        [Description("Resolvido")]
        Resolved = 5,

        [Description("Fechado")]
        Closed = 6,

        [Description("Cancelado")]
        Cancelled = 7
    }
}