namespace CircleHub.Api.Dtos
{
    public class PollDto
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public bool IsExpired { get; set; }
        public int TotalVotes { get; set; }
        public Guid? MyVotedOptionId { get; set; }
        public List<PollOptionDto> Options { get; set; } = new();
    }

    public class PollOptionDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public int VotesCount { get; set; }
        public double Percentage { get; set; }
    }

    public class VotePollDto
    {
        public Guid OptionId { get; set; }
    }
}
