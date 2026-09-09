using Microsoft.EntityFrameworkCore;
using WebSocketChat.Api.Data;
using WebSocketChat.Api.Services;
using WebSocketChat.Api.WebSockets;

var builder = WebApplication.CreateBuilder(args);

var chatDatabaseConnection = builder.Configuration.GetConnectionString("ChatDatabase")
?? throw new InvalidOperationException("Connection string 'ChatDatabase' não encontrada.");
Console.WriteLine(
    $"Diretório de execução: {Directory.GetCurrentDirectory()}"
);

Console.WriteLine(
    $"Connection string SQLite: {chatDatabaseConnection}"
);

builder.Services.AddDbContextFactory<ChatDbContext>(
    options =>
        options.UseSqlite(chatDatabaseConnection)
);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<WebSocketConnectionManager>();
builder.Services.AddSingleton<ChatMessagePersistenceService>();
builder.Services.AddSingleton<ChatWebSocketHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

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

    var roomId = context.Request.Query["roomId"].ToString().Trim().ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(roomId))
    {
        roomId = "geral";
    }

    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
    var handler = context.RequestServices.GetRequiredService<ChatWebSocketHandler>();
    await handler.HandleAsync(webSocket, roomId, context.RequestAborted);
});

app.Run();