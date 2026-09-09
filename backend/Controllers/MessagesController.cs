using Microsoft.AspNetCore.Mvc;
using WebSocketChat.Api.Models;
using WebSocketChat.Api.Services;

namespace WebSocketChat.Api.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessagesController : ControllerBase
    {
        private readonly ChatMessagePersistenceService
            _persistenceService;

        public MessagesController(
            ChatMessagePersistenceService persistenceService)
        {
            _persistenceService = persistenceService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ChatMessage>>>
            GetMessages(
                [FromQuery] string roomId,
                [FromQuery] int limit = 50,
                CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roomId))
            {
                return BadRequest(
                    "O parâmetro roomId é obrigatório."
                );
            }

            var messages =
                await _persistenceService
                    .GetRecentMessagesAsync(
                        roomId,
                        limit,
                        cancellationToken
                    );

            return Ok(messages);
        }
    }
}