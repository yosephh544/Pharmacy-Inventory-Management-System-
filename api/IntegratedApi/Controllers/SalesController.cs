using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IntegratedImplementation.DTOs.Sales;
using IntegratedImplementation.Interfaces;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/sales")]
    [Authorize(Roles = "Admin,Pharmacist,Cashier")]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;

        public SalesController(ISalesService salesService)
        {
            _salesService = salesService;
        }

        /// <summary>Create a new sale. Deducts stock from batches (FIFO), validates no expired and no over-sell.</summary>
        [HttpPost("createSale")]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleRequestDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized(new { message = "User not identified." });
                var sale = await _salesService.CreateSaleAsync(dto, userId);
                return CreatedAtAction(nameof(GetSaleById), new { id = sale.Id }, sale);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the sale.", error = ex.Message });
            }
        }

        /// <summary>Get all sales with optional filters and pagination.</summary>
        [HttpGet("getSales")]
        public async Task<IActionResult> GetSales([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int? soldByUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var (items, totalCount) = await _salesService.GetSalesAsync(fromDate, toDate, soldByUserId, page, pageSize);
                return Ok(new { items, totalCount, page, pageSize });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving sales.", error = ex.Message });
            }
        }

        /// <summary>Get a single sale by ID with full details (receipt view).</summary>
        [HttpGet("getSaleById/{id:int}")]
        public async Task<IActionResult> GetSaleById([FromRoute] int id)
        {
            try
            {
                var sale = await _salesService.GetSaleByIdAsync(id);
                if (sale == null)
                    return NotFound(new { message = $"Sale with ID {id} not found." });
                return Ok(sale);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the sale.", error = ex.Message });
            }
        }

        /// <summary>Cancel a sale. Restores batch quantities and sets IsCancelled; does not delete the sale.</summary>
        [HttpPost("cancelSale/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelSale([FromRoute] int id)
        {
            try
            {
                await _salesService.CancelSaleAsync(id);
                return Ok(new { message = "Sale cancelled successfully. Stock has been restored." });
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
                return StatusCode(500, new { message = "An error occurred while cancelling the sale.", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var id) ? id : 0;
        }
    }
}
