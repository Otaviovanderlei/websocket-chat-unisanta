using Microsoft.EntityFrameworkCore;
using WebSocketChat.Api.Data;
using WebSocketChat.Api.Services;
using WebSocketChat.Api.WebSockets;

var builder = WebApplication.CreateBuilder(args);

var chatDatabaseConnection =
    builder.Configuration.GetConnectionString("ChatDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'ChatDatabase' não encontrada."
    );

builder.Services.AddDbContextFactory<ChatDbContext>(
    options =>
        options.UseSqlite(chatDatabaseConnection)
);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

<<<<<<< Updated upstream
=======
builder.Services.AddSingleton<WebSocketConnectionManager>();
builder.Services.AddSingleton<ChatMessagePersistenceService>();
builder.Services.AddSingleton<ChatWebSocketHandler>();

var frontendOrigin =
    builder.Configuration["FRONTEND_ORIGIN"];

>>>>>>> Stashed changes
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:5173"
        };

        if (!string.IsNullOrWhiteSpace(frontendOrigin))
        {
            allowedOrigins.Add(frontendOrigin);
        }

        policy
            .WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<WebSocketConnectionManager>();
builder.Services.AddSingleton<ChatMessagePersistenceService>();
builder.Services.AddSingleton<ChatWebSocketHandler>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContextFactory =
        scope.ServiceProvider
            .GetRequiredService<IDbContextFactory<ChatDbContext>>();

    await using var dbContext =
        await dbContextFactory.CreateDbContextAsync();

    await dbContext.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseAuthorization();

app.UseWebSockets();

app.MapControllers();

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode =
            StatusCodes.Status400BadRequest;

        return;
    }

    var roomId =
        context.Request.Query["roomId"]
            .ToString()
            .Trim()
            .ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(roomId))
    {
        roomId = "geral";
    }

    var webSocket =
        await context.WebSockets
            .AcceptWebSocketAsync();

    var handler =
        context.RequestServices
            .GetRequiredService<ChatWebSocketHandler>();

    await handler.HandleAsync(
        webSocket,
        roomId,
        context.RequestAborted
    );
});

app.Run();