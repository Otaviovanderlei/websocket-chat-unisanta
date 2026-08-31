using Microsoft.AspNetCore.Mvc;

namespace WebSocketChat.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "online",
                application = "WebSocket Chat API"
            });
        }
    }
}