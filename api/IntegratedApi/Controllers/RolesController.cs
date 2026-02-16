using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetRoles()
        {
            return Ok(new object[0]);
        }

        [HttpPost]
        public IActionResult CreateRole([FromBody] object model)
        {
            return Created(string.Empty, model);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteRole([FromRoute] int id)
        {
            return NoContent();
        }
    }
}
