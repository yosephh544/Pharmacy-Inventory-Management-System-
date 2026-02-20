using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Reports;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,Manager")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;

        public ReportsController(IReportsService reportsService)
        {
            _reportsService = reportsService;
        }

        /// <summary>Get current stock report showing available stock per medicine.</summary>
        [HttpGet("current-stock")]
        public async Task<IActionResult> CurrentStock()
        {
            try
            {
                var report = await _reportsService.GetCurrentStockReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the current stock report.", error = ex.Message });
            }
        }

        /// <summary>Get batches that will expire within the specified threshold (default 30 days).</summary>
        [HttpGet("near-expiry")]
        public async Task<IActionResult> NearExpiry([FromQuery] int daysThreshold = 30)
        {
            try
            {
                if (daysThreshold < 1 || daysThreshold > 365)
                    return BadRequest(new { message = "Days threshold must be between 1 and 365." });

                var report = await _reportsService.GetNearExpiryReportAsync(daysThreshold);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the near expiry report.", error = ex.Message });
            }
        }

        /// <summary>Get expired batches that still have remaining stock.</summary>
        [HttpGet("expired")]
        public async Task<IActionResult> ExpiredMedicines()
        {
            try
            {
                var report = await _reportsService.GetExpiredReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the expired medicines report.", error = ex.Message });
            }
        }

        /// <summary>Get daily sales summary grouped by date.</summary>
        [HttpGet("sales-daily")]
        public async Task<IActionResult> DailySales([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var report = await _reportsService.GetDailySalesReportAsync(fromDate, toDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the daily sales report.", error = ex.Message });
            }
        }

        /// <summary>Get monthly sales summary grouped by year and month.</summary>
        [HttpGet("sales-monthly")]
        public async Task<IActionResult> MonthlySales([FromQuery] int? year)
        {
            try
            {
                var report = await _reportsService.GetMonthlySalesReportAsync(year);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the monthly sales report.", error = ex.Message });
            }
        }

        /// <summary>Get purchase history with optional filters.</summary>
        [HttpGet("purchase-history")]
        public async Task<IActionResult> PurchaseHistory(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int? supplierId,
            [FromQuery] int? medicineId)
        {
            try
            {
                var report = await _reportsService.GetPurchaseHistoryReportAsync(fromDate, toDate, supplierId, medicineId);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating the purchase history report.", error = ex.Message });
            }
        }

        /// <summary>Export report to file (CSV/Excel/PDF).</summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportReport([FromQuery] ExportReportRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.ReportType))
                    return BadRequest(new { message = "ReportType is required." });

                var fileBytes = await _reportsService.ExportReportAsync(request);

                var contentType = request.Format.ToLower() switch
                {
                    "csv" => "text/csv",
                    "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "pdf" => "application/pdf",
                    _ => "application/octet-stream"
                };

                var fileName = $"{request.ReportType}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.{request.Format.ToLower()}";

                return File(fileBytes, contentType, fileName);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while exporting the report.", error = ex.Message });
            }
        }
    }
}
