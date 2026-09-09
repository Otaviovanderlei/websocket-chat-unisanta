using Microsoft.EntityFrameworkCore;
using WebSocketChat.Api.Data;
using WebSocketChat.Api.Data.Entities;
using WebSocketChat.Api.Models;

namespace WebSocketChat.Api.Services
{
    public class ChatMessagePersistenceService
    {
        private readonly IDbContextFactory<ChatDbContext> _dbContextFactory;

        public ChatMessagePersistenceService(
            IDbContextFactory<ChatDbContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        public async Task SaveAsync(
            ChatMessage message,
            CancellationToken cancellationToken)
        {


            await using var context =
                await _dbContextFactory.CreateDbContextAsync(
                    cancellationToken
                );



            var entity = new ChatMessageEntity
            {
                Sender = message.Sender,
                Content = message.Content,
                RoomId = message.RoomId,
                TimestampUtc = message.Timestamp.UtcDateTime
            };

            context.Messages.Add(entity);

            var rowsAffected =
                await context.SaveChangesAsync(
                    cancellationToken
                );


        }

        public async Task<List<ChatMessage>> GetRecentMessagesAsync(
            string roomId,
            int limit,
            CancellationToken cancellationToken)
        {
            await using var context =
                await _dbContextFactory.CreateDbContextAsync(
                    cancellationToken
                );

            var normalizedRoomId =
                roomId.Trim().ToLowerInvariant();

            var normalizedLimit =
                Math.Clamp(limit, 1, 100);

            var entities =
                await context.Messages.AsNoTracking().Where(message =>
                message.RoomId == normalizedRoomId).OrderByDescending(message =>
                message.TimestampUtc).Take(normalizedLimit).ToListAsync(cancellationToken);

            return entities.OrderBy(message => message.TimestampUtc).Select(message => new ChatMessage
            {
                Sender = message.Sender,
                Content = message.Content,
                RoomId = message.RoomId,
                Timestamp = new DateTimeOffset(DateTime.SpecifyKind(message.TimestampUtc, DateTimeKind.Utc))
            }).ToList();
        }
    }
}