using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using Microsoft.EntityFrameworkCore;

namespace CircleHub.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Community> Communities => Set<Community>();
        public DbSet<Post> Posts => Set<Post>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<Like> Likes => Set<Like>();
        public DbSet<CommunityMember> CommunityMembers => Set<CommunityMember>();
        public DbSet<CommunityJoinRequest> CommunityJoinRequests => Set<CommunityJoinRequest>();
        public DbSet<CommunityPostModerationLog> CommunityModerationLogs => Set<CommunityPostModerationLog>();
        public DbSet<Follow> Follows => Set<Follow>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<UserDeviceKey> UserDeviceKeys => Set<UserDeviceKey>();
        public DbSet<UserKeyBackup> UserKeyBackups => Set<UserKeyBackup>();
        public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();
        public DbSet<Poll> Polls => Set<Poll>();
        public DbSet<PollOption> PollOptions => Set<PollOption>();
        public DbSet<PollVote> PollVotes => Set<PollVote>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Actor)
                .WithMany()
                .HasForeignKey(n => n.ActorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Deleting the post takes its notifications with it: "liked your post" is meaningless once the
            // post is gone, and the row exists to be opened.
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Post)
                .WithMany()
                .HasForeignKey(n => n.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Community)
                .WithMany()
                .HasForeignKey(n => n.CommunityId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(p => p.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(p => p.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Post)
                .WithMany()
                .HasForeignKey(m => m.PostId)
                .OnDelete(DeleteBehavior.SetNull);

            // A device key exists only for its owner; deleting the user takes every published key with it.
            modelBuilder.Entity<UserDeviceKey>()
                .HasOne(k => k.User)
                .WithMany()
                .HasForeignKey(k => k.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserDeviceKey>().Property(k => k.DeviceId).HasMaxLength(64);
            modelBuilder.Entity<UserDeviceKey>().Property(k => k.PublicKey).HasMaxLength(200);

            // A backup exists only for its owner; deleting the user takes the wrapped blob with it.
            modelBuilder.Entity<UserKeyBackup>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserKeyBackup>().Property(b => b.WrappedAccountKey).HasMaxLength(500);
            modelBuilder.Entity<UserKeyBackup>().Property(b => b.Salt).HasMaxLength(100);
            modelBuilder.Entity<UserKeyBackup>().Property(b => b.KdfAlgorithm).HasMaxLength(40);

            // Push tokens belong to a signed-in user; deleting the user cascades their registered devices away.
            modelBuilder.Entity<DeviceToken>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DeviceToken>().Property(d => d.Token).HasMaxLength(255);
            modelBuilder.Entity<DeviceToken>().Property(d => d.Platform).HasMaxLength(20);

            modelBuilder.Entity<User>().Property(u => u.ProfileVisibility).HasConversion<string>().HasMaxLength(20);
            modelBuilder.Entity<User>().Property(u => u.MessagesFrom).HasConversion<string>().HasMaxLength(20).HasDefaultValue(MessagesFrom.Followers);
            modelBuilder.Entity<Community>().Property(c => c.Visibility).HasConversion<string>();
            modelBuilder.Entity<CommunityMember>().Property(m => m.Role).HasConversion<string>();
            modelBuilder.Entity<CommunityJoinRequest>().Property(r => r.Status).HasConversion<string>();
            modelBuilder.Entity<CommunityPostModerationLog>().Property(l => l.Action).HasConversion<string>();
            modelBuilder.Entity<Notification>().Property(n => n.Type).HasConversion<string>().HasMaxLength(40);

            modelBuilder.Entity<User>().Property(u => u.Username).HasMaxLength(50);
            modelBuilder.Entity<User>().Property(u => u.Email).HasMaxLength(255);
            modelBuilder.Entity<Community>().Property(c => c.Slug).HasMaxLength(255);

            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<Community>().HasIndex(c => c.Slug).IsUnique();
            modelBuilder.Entity<Like>().HasIndex(l => new { l.PostId, l.UserId }).IsUnique();
            modelBuilder.Entity<Follow>().HasIndex(f => new { f.FollowerId, f.FollowingId }).IsUnique();
            modelBuilder.Entity<CommunityMember>().HasIndex(m => new { m.CommunityId, m.UserId }).IsUnique();
            modelBuilder.Entity<CommunityJoinRequest>().HasIndex(r => new { r.CommunityId, r.UserId }).IsUnique();
            modelBuilder.Entity<ConversationParticipant>().HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();
            modelBuilder.Entity<Conversation>().HasIndex(c => c.LastMessageAt);
            modelBuilder.Entity<Message>().HasIndex(m => new { m.ConversationId, m.CreatedAt });
            // One row per device per user: the register call is an upsert on this pair.
            modelBuilder.Entity<UserDeviceKey>().HasIndex(k => new { k.UserId, k.DeviceId }).IsUnique();
            // The directory is read ordered by recency and pruned by it, both scoped to one user.
            modelBuilder.Entity<UserDeviceKey>().HasIndex(k => new { k.UserId, k.LastSeenAt });
            // One backup per user: saving again replaces it, so this is also the upsert key.
            modelBuilder.Entity<UserKeyBackup>().HasIndex(b => b.UserId).IsUnique();
            // One row per physical push token: re-registering (even after switching accounts on the same phone)
            // updates the existing row in place via ON DUPLICATE KEY UPDATE; UserId is indexed for recipient lookups.
            modelBuilder.Entity<DeviceToken>().HasIndex(d => d.Token).IsUnique();
            modelBuilder.Entity<DeviceToken>().HasIndex(d => d.UserId);
            // The feed is always "this user's rows, newest first"; the unread count reads the same index.
            modelBuilder.Entity<Notification>().HasIndex(n => new { n.UserId, n.CreatedAt });

            // Community Polls & Rich Post Types
            modelBuilder.Entity<Poll>()
                .HasOne(p => p.Post)
                .WithOne(p => p.Poll)
                .HasForeignKey<Poll>(p => p.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PollOption>()
                .HasOne(o => o.Poll)
                .WithMany(p => p.Options)
                .HasForeignKey(o => o.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PollVote>()
                .HasOne(v => v.Poll)
                .WithMany(p => p.Votes)
                .HasForeignKey(v => v.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PollVote>()
                .HasOne(v => v.PollOption)
                .WithMany(o => o.Votes)
                .HasForeignKey(v => v.PollOptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PollVote>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PollVote>()
                .HasIndex(v => new { v.PollId, v.UserId })
                .IsUnique();
        }
    }
}
