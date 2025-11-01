using System.ComponentModel;

namespace TicketSystem.API.Models.Enums
{
	/// <summary>
	/// Niveis de prioridade dos tickets
	/// </summary>
	public enum TicketPriority
	{
		[Description("Baixa")]
		Low = 1,

		[Description("Normal")]
		Normal = 2,

		[Description("Alta")]
		High = 3,

		[Description("Emergencial")]
		Urgent = 4,
	}
}
