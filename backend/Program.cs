using System.Net.WebSockets;
using System.Text;






var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseWebSockets();

app.MapControllers();

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    using var webSocket =
        await context.WebSockets.AcceptWebSocketAsync();

    var buffer = new byte[4096];

    while (webSocket.State == WebSocketState.Open)
    {
        var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), context.RequestAborted
        );

        if (result.MessageType == WebSocketMessageType.Close)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Conexão encerrada", CancellationToken.None);
            break;
        }

        var mensagem = Encoding.UTF8.GetString(buffer, 0, result.Count);

        Console.WriteLine($"Mensagem recebida: {mensagem}");

        var resposta = Encoding.UTF8.GetBytes($"Servidor recebeu: {mensagem}");

        await webSocket.SendAsync(new ArraySegment<byte>(resposta), WebSocketMessageType.Text, true, context.RequestAborted);
    }
});

app.Run();
