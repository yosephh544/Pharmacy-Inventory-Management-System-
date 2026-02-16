using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/sales")]
    [Authorize(Roles = "Admin,Pharmacist,Cashier")]
    public class SalesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetSales()
        {
            return Ok(new object[0]);
        }

        [HttpGet("{id}")]
        public IActionResult GetSaleById([FromRoute] int id)
        {
            return Ok(new { id });
        }

        [HttpPost]
        public IActionResult CreateSale([FromBody] object model)
        {
            return Created(string.Empty, model);
        }

        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Admin")]
        public IActionResult CancelSale([FromRoute] int id)
        {
            return NoContent();
        }
    }
}
