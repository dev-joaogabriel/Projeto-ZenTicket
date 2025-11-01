using System.ComponentModel.DataAnnotations;

namespace TicketSystem.API.Models.DTOs
{
    public class AiAnalyzeRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        // Adaptive feedback from the client to make suggestions iterative and non-repetitive
        public List<string>? DoneActions { get; set; } = new();
        public List<string>? RejectedActions { get; set; } = new();
        public List<string>? PriorSuggestions { get; set; } = new();
    }

    public class AiAnalyzeResponse
    {
        public List<string> Suggestions { get; set; } = new();
        public int? PredictedDepartmentId { get; set; }
        public string? PredictedDepartmentName { get; set; }
        public double? Confidence { get; set; }
        public string? PriorityHint { get; set; }
        public string? Rationale { get; set; }
        public string? Source { get; set; }

        // Extras for an adaptive flow
        public string? NextAction { get; set; }
        public List<string> FollowUpQuestions { get; set; } = new();
    }
}
