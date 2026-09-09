using Microsoft.EntityFrameworkCore;
using WebSocketChat.Api.Data.Entities;

namespace WebSocketChat.Api.Data
{
    public class ChatDbContext : DbContext
    {
        public ChatDbContext(
            DbContextOptions<ChatDbContext> options)
            : base(options)
        {
        }

        public DbSet<ChatMessageEntity> Messages =>
            Set<ChatMessageEntity>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            var message = modelBuilder.Entity<ChatMessageEntity>();
            message.ToTable("Messages");
            message.HasKey(x => x.Id);
            message.Property(x => x.Sender).IsRequired().HasMaxLength(100);
            message.Property(x => x.Content).IsRequired().HasMaxLength(4000);
            message.Property(x => x.RoomId).IsRequired().HasMaxLength(100);
            message.HasIndex(x => new
            {
                x.RoomId,
                x.TimestampUtc
            });
        }
    }
}