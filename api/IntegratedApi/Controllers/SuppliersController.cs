using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/suppliers")]
    [Authorize(Roles = "Admin,Storekeeper")]
    public class SuppliersController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetSuppliers()
        {
            return Ok(new object[0]);
        }

        [HttpPost]
        public IActionResult CreateSupplier([FromBody] object model)
        {
            return Created(string.Empty, model);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateSupplier([FromRoute] int id, [FromBody] object model)
        {
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult SoftDeleteSupplier([FromRoute] int id)
        {
            return NoContent();
        }
    }
}
