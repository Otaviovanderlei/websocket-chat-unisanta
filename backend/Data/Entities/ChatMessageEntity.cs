namespace WebSocketChat.Api.Data.Entities
{
    public class ChatMessageEntity
    {
        public long Id { get; set; }

        public string Sender { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public string RoomId { get; set; } = string.Empty;

        public DateTime TimestampUtc { get; set; }
    }
}
