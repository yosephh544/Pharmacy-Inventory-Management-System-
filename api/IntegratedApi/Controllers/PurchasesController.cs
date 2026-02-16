using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
	[ApiController]
	[Route("api/purchases")]
	[Authorize(Roles = "Admin,Storekeeper")]
	public class PurchasesController : ControllerBase
	{
		[HttpGet]
		public IActionResult GetPurchases()
		{
			return Ok(new object[0]);
		}

		[HttpGet("{id}")]
		public IActionResult GetPurchaseById([FromRoute] int id)
		{
			return Ok(new { id });
		}

		[HttpPost]
		public IActionResult CreatePurchase([FromBody] object model)
		{
			return Created(string.Empty, model);
		}
	}
}
