using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using WebSocketChat.Api.WebSockets.Connections;

namespace WebSocketChat.Api.Services
{
    public class WebSocketConnectionManager
    {
        private readonly ConcurrentDictionary<
            Guid, WebSocketConnection> _connections = new();

        public Guid AddSocket(WebSocket socket, string roomId)
        {
            var connectionId = Guid.NewGuid();
            var connection = new WebSocketConnection(socket, roomId
            );

            _connections.TryAdd(connectionId, connection);
            return connectionId;
        }

        public async Task RemoveSocketAsync(
            Guid connectionId)
        {
            if (_connections.TryRemove(connectionId, out var connection))
            {
                var socket = connection.Socket;
                if (socket.State == WebSocketState.Open)
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Conexão encerrada", CancellationToken.None);
                }
                socket.Dispose();
            }
        }

        public async Task BroadcastToRoomAsync(string roomId, string message)
        {
            var messageBytes =
                Encoding.UTF8.GetBytes(message);

            foreach (var connection in _connections)
            {
                var currentConnection = connection.Value;

                if (!string.Equals(
                    currentConnection.RoomId, roomId, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var socket = currentConnection.Socket;

                if (socket.State == WebSocketState.Open)
                {
                    await socket.SendAsync(new ArraySegment<byte>(messageBytes),
                    WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }
    }
}