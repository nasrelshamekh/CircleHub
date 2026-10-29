namespace CircleHub.Api.Entities
{
    public class PollOption
    {
        public Guid Id { get; set; }
        public Guid PollId { get; set; }
        public Poll Poll { get; set; } = null!;

        public string Text { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }

        public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
    }
}
