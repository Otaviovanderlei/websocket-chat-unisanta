namespace WebSocketChat.Api.Models
{
    public class ChatMessage
    {

        public string Sender { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public string RoomId { get; set; } = string.Empty;

        public DateTimeOffset Timestamp { get; set; }
    }
}
