using System.Net.WebSockets;

namespace WebSocketChat.Api.WebSockets.Connections
{
    public class WebSocketConnection
    {
        public WebSocket Socket { get; set; }

        public string RoomId { get; set; }

        public WebSocketConnection(
            WebSocket socket,
            string roomId)
        {
            Socket = socket;
            RoomId = roomId;
        }
    }
}
