using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Batches;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/batches")]
     [Authorize]
    public class MedicineBatchesController : ControllerBase
    {
        private readonly IMedicineBatchService _batchService;

        public MedicineBatchesController(IMedicineBatchService batchService)
        {
            _batchService = batchService;
        }

        [HttpGet("GetBAtchByID/{id}")]
        public async Task<IActionResult> GetBatchById([FromRoute] int id)
        {
            try
            {
                var batch = await _batchService.GetBatchByIdAsync(id);
                return Ok(batch);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("GetBatchesByMedicine/{medicineId}")]
        public async Task<IActionResult> GetBatchesByMedicine([FromRoute] int medicineId)
        {
            var batches = await _batchService.GetBatchesByMedicineIdAsync(medicineId);
            return Ok(batches);
        }

        [HttpPost("CreateBatch")]
        [Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
        public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequestDto dto)
        {
            try
            {
                var batch = await _batchService.CreateBatchAsync(dto);
                return CreatedAtAction(nameof(GetBatchById), new { id = batch.Id }, batch);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("UpdateBatch/{id}")]
        [Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
        public async Task<IActionResult> UpdateBatch([FromRoute] int id, [FromBody] UpdateBatchRequestDto dto)
        {
            try
            {
                var batch = await _batchService.UpdateBatchAsync(id, dto);
                return Ok(batch);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("AdjustStock/{id}")]
        [Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
        public async Task<IActionResult> AdjustStock([FromRoute] int id, [FromBody] AdjustStockRequestDto dto)
        {
            var result = await _batchService.AdjustStockAsync(id, dto);
            if (!result) return NotFound();
            return Ok();
        }

        [HttpDelete("DeleteBatch/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteBatch([FromRoute] int id)
        {
            var result = await _batchService.DeleteBatchAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
