using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using WebSocketChat.Api.Models;
using WebSocketChat.Api.Services;

namespace WebSocketChat.Api.WebSockets
{
    public class ChatWebSocketHandler
    {
        private readonly WebSocketConnectionManager _connectionManager;

        public ChatWebSocketHandler(WebSocketConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
        }

        public async Task HandleAsync(WebSocket webSocket, string roomId, CancellationToken cancellationToken)
        {
            var connectionId = _connectionManager.AddSocket(webSocket, roomId);

            Console.WriteLine($"Conexão {connectionId} entrou na sala '{roomId}'.");

            var buffer = new byte[4096];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                    if (result.MessageType ==
                        WebSocketMessageType.Close)
                    {
                        break;
                    }

                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ChatMessage? message;

                    try
                    {
                        message = JsonSerializer.Deserialize<ChatMessage>(json, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        }
                            );
                    }
                    catch (JsonException)
                    {
                        Console.WriteLine("Mensagem recebida com JSON inválido.");

                        continue;
                    }

                    if (
                        message == null || string.IsNullOrWhiteSpace(message.Sender) || string.IsNullOrWhiteSpace(message.Content))
                    {
                        continue;
                    }

                    message.RoomId = roomId;
                    message.Timestamp = DateTimeOffset.UtcNow;

                    var responseJson = JsonSerializer.Serialize(message, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }
                        );

                    Console.WriteLine($"[{roomId}] " + $"[{message.Sender}] " + $"{message.Content}");

                    await _connectionManager.BroadcastToRoomAsync(roomId, responseJson);
                }
            }
            finally
            {
                await _connectionManager.RemoveSocketAsync(connectionId);
                Console.WriteLine($"Conexão {connectionId} saiu da sala '{roomId}'.");
            }
        }
    }
}