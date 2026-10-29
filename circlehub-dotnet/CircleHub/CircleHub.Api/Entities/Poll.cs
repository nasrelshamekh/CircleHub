namespace CircleHub.Api.Entities
{
    public class Poll
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Post Post { get; set; } = null!;

        public string Question { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
        public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
    }
}
