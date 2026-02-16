using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetNotifications()
        {
            return Ok(new object[0]);
        }

        [HttpPost("{id}/read")]
        public IActionResult MarkAsRead([FromRoute] int id)
        {
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteNotification([FromRoute] int id)
        {
            return NoContent();
        }
    }
}
