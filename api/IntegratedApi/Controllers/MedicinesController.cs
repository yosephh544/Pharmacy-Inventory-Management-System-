using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntegratedApi.Controllers
{
	[ApiController]
	[Route("api/medicines")]
	[Authorize]
	public class MedicinesController : ControllerBase
	{
		[HttpGet]
		public IActionResult GetMedicines()
		{
			return Ok(new object[0]);
		}

		[HttpGet("{id}")]
		public IActionResult GetMedicineById([FromRoute] int id)
		{
			return Ok(new { id });
		}

		[HttpPost]
		[Authorize(Roles = "Admin,Storekeeper")]
		public IActionResult CreateMedicine([FromBody] object model)
		{
			return Created(string.Empty, model);
		}

		[HttpPut("{id}")]
		[Authorize(Roles = "Admin,Storekeeper")]
		public IActionResult UpdateMedicine([FromRoute] int id, [FromBody] object model)
		{
			return NoContent();
		}

		[HttpDelete("{id}")]
		[Authorize(Roles = "Admin")]
		public IActionResult DeleteMedicine([FromRoute] int id)
		{
			return NoContent();
		}
	}
}
