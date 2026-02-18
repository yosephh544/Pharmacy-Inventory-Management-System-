using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Role;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet("GetRoles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles = await _roleService.GetAllRolesAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving roles", error = ex.Message });
            }
        }

        [HttpGet("GetRoleById")]
        public async Task<IActionResult> GetRoleById([FromRoute] int id)
        {
            try
            {
                var role = await _roleService.GetRoleByIdAsync(id);
                return Ok(role);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the role", error = ex.Message });
            }
        }

        [HttpPost("CreateRole")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto model)
        {
            try
            {
                var role = await _roleService.CreateRoleAsync(model);
                return CreatedAtAction(nameof(GetRoleById), new { id = role.Id }, role);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the role", error = ex.Message });
            }
        }

        [HttpDelete("DeleteRole/{id:int}")]
        public async Task<IActionResult> DeleteRole([FromRoute] int id)
        {
            try
            {
                var result = await _roleService.DeleteRoleAsync(id);
                if (!result)
                    return NotFound(new { message = $"Role with ID {id} not found" });

                return Ok(new { message = $"Role with ID {id} was deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the role", error = ex.Message });
            }
        }
    }
}
