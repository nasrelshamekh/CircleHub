namespace CircleHub.Api.Entities
{
    public class PollVote
    {
        public Guid Id { get; set; }

        public Guid PollId { get; set; }
        public Poll Poll { get; set; } = null!;

        public Guid PollOptionId { get; set; }
        public PollOption PollOption { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime VotedAt { get; set; } = DateTime.UtcNow;
    }
}
