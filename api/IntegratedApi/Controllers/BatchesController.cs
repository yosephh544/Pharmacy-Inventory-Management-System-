using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/batches")]
    [Authorize]
    public class MedicineBatchesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetBatches()
        {
            return Ok(new object[0]);
        }

        [HttpGet("{id}")]
        public IActionResult GetBatchById([FromRoute] int id)
        {
            return Ok(new { id });
        }

        [HttpGet("medicine/{medicineId}")]
        public IActionResult GetBatchesByMedicine([FromRoute] int medicineId)
        {
            return Ok(new object[0]);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Storekeeper")]
        public IActionResult CreateBatch([FromBody] object model)
        {
            return CreatedAtAction(nameof(GetBatchById), new { id = 0 }, model);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Storekeeper")]
        public IActionResult UpdateBatch([FromRoute] int id, [FromBody] object model)
        {
            return NoContent();
        }

        [HttpPost("{id}/adjust")]
        [Authorize(Roles = "Admin,Storekeeper")]
        public IActionResult AdjustStock([FromRoute] int id, [FromBody] object adjustment)
        {
            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult SoftDeleteBatch([FromRoute] int id)
        {
            return NoContent();
        }
    }
}
