using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
	[ApiController]
	[Route("api/users")]
	[Authorize(Roles = "Admin")]
	public class UserController : ControllerBase
	{
		[HttpGet]
		public IActionResult GetUsers()
		{
			return Ok(new object[0]);
		}

		[HttpGet("{id}")]
		public IActionResult GetUserById([FromRoute] int id)
		{
			return Ok(new { id });
		}

		[HttpPost]
		public IActionResult CreateUser([FromBody] object model)
		{
			return Created(string.Empty, model);
		}
	}
}
