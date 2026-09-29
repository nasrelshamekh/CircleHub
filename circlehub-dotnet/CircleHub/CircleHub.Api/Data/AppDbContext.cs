using CircleHub.Api.Entities;
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            modelBuilder.Entity<Community>().Property(c => c.Visibility).HasConversion<string>();
            modelBuilder.Entity<CommunityMember>().Property(m => m.Role).HasConversion<string>();
            modelBuilder.Entity<CommunityJoinRequest>().Property(r => r.Status).HasConversion<string>();
            modelBuilder.Entity<CommunityPostModerationLog>().Property(l => l.Action).HasConversion<string>();

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
        }
    }
}
