using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,Manager")]
    public class ReportsController : ControllerBase
    {
        [HttpGet("current-stock")]
        public IActionResult CurrentStock()
        {
            return Ok(new object[0]);
        }

        [HttpGet("near-expiry")]
        public IActionResult NearExpiry()
        {
            return Ok(new object[0]);
        }

        [HttpGet("expired")]
        public IActionResult ExpiredMedicines()
        {
            return Ok(new object[0]);
        }

        [HttpGet("sales-daily")]
        public IActionResult DailySales()
        {
            return Ok(new object[0]);
        }

        [HttpGet("sales-monthly")]
        public IActionResult MonthlySales()
        {
            return Ok(new object[0]);
        }

        [HttpGet("purchase-history")]
        public IActionResult PurchaseHistory()
        {
            return Ok(new object[0]);
        }

        [HttpGet("export")]
        public IActionResult ExportReport()
        {
            return Ok();
        }
    }
}
