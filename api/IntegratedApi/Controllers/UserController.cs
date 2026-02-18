using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.User;

namespace IntegratedApi.Controllers
{
	[ApiController]
	[Route("api/users")]
	[Authorize(Roles = "Admin")]
	public class UserController : ControllerBase
	{
		private readonly IUserService _userService;

		public UserController(IUserService userService)
		{
			_userService = userService;
		}

		[HttpGet("GetUsers")]
		public async Task<IActionResult> GetUsers()
		{
			try
			{
				var users = await _userService.GetAllUsersAsync();
				return Ok(users);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
			}
		}

		[HttpGet("GetUserById")]
		public async Task<IActionResult> GetUserById([FromQuery] int id)
		{
			try
			{
				var user = await _userService.GetUserByIdAsync(id);
				return Ok(user);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "An error occurred while retrieving the user", error = ex.Message });
			}
		}

		[HttpPost("CreateUser")]
		public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto model)
		{
			try
			{
				var user = await _userService.CreateUserAsync(model);
				return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
			}
		}

		// PUT: api/users/UpdateUser/10
		[HttpPut("UpdateUser/{id:int}")]
		public async Task<IActionResult> UpdateUser([FromRoute] int id, [FromBody] UpdateUserRequestDto model)
		{
			try
			{
				var user = await _userService.UpdateUserAsync(id, model);
				return Ok(user);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "An error occurred while updating the user", error = ex.Message });
			}
		}

		// DELETE: api/users/DeleteUser/10
		[HttpDelete("DeleteUser/{id:int}")]
		public async Task<IActionResult> DeactivateUser([FromRoute] int id)
		{
			try
			{
				var result = await _userService.DeactivateUserAsync(id);
				if (!result)
					return NotFound(new { message = $"User with ID {id} not found" });

				// Explicit success response so the client clearly knows what happened
				return Ok(new { message = $"User with ID {id} was deactivated successfully" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "An error occurred while deactivating the user", error = ex.Message });
			}
		}
	}
}
