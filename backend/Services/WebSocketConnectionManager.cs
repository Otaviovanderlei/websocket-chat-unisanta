using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;


namespace WebSocketChat.Api.Services
{
    public class WebSocketConnectionManager
    {
        private readonly ConcurrentDictionary<Guid, WebSocket> _connections = new();

        public Guid AddSocket(WebSocket socket)
        {
            var connectionId = Guid.NewGuid();
            _connections.TryAdd(connectionId, socket);
            return connectionId;
        }

        public async Task RemoveSocketAsync(Guid connectionId)
        {
            if (_connections.TryRemove(connectionId, out var socket))
            {
                if (socket.State == WebSocketState.Open)
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure,
                        "Conexão encerrada", CancellationToken.None);
                }
                socket.Dispose();
            }
        }

        public async Task BroadcastAsync(string message)
        {
            var messageBytes = Encoding.UTF8.GetBytes(message);

            foreach (var connection in _connections)
            {
                var socket = connection.Value;

                if (socket.State == WebSocketState.Open)
                {
                    await socket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text,
                        true, CancellationToken.None);
                }
            }
        }
    }
}
