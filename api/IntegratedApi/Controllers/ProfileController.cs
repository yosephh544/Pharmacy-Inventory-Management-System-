using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.User;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IUserService _userService;

        public ProfileController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
        {
            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString))
                    return Unauthorized(new { message = "User not identified" });

                if (!int.TryParse(userIdString, out int userId))
                {
                    // For SuperAdmin, userId might be -1
                    if (userIdString == "-1")
                    {
                         return BadRequest(new { message = "SuperAdmin password cannot be changed via this API. Please update the source code constants." });
                    }
                    return BadRequest(new { message = "Invalid user ID" });
                }

                var success = await _userService.ChangePasswordAsync(userId, dto);
                if (success)
                    return Ok(new { message = "Password changed successfully" });

                return BadRequest(new { message = "Failed to change password" });
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
                return StatusCode(500, new { message = "An error occurred while changing password", error = ex.Message });
            }
        }
    }
}
