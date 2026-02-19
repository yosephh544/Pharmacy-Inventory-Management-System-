using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Medicines;

namespace IntegratedApi.Controllers
{
	[ApiController]
	[Route("api/medicines")]
	 [Authorize]
	public class MedicinesController : ControllerBase
	{
		private readonly IMedicineService _medicineService;

		public MedicinesController(IMedicineService medicineService)
		{
			_medicineService = medicineService;
		}

		[HttpGet("GetMedicines")]
		public async Task<IActionResult> GetMedicines()
		{
			var medicines = await _medicineService.GetAllMedicinesAsync();
			return Ok(medicines);
		}

		[HttpGet("GetMedicineById/{id}")]
		public async Task<IActionResult> GetMedicineById([FromRoute] int id)
		{
			try
			{
				var medicine = await _medicineService.GetMedicineByIdAsync(id);
				return Ok(medicine);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
		}

		[HttpPost("CreateMedicine")]
		[Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
		public async Task<IActionResult> CreateMedicine([FromBody] CreateMedicineRequestDto dto)
		{
			try
			{
				var medicine = await _medicineService.CreateMedicineAsync(dto);
				return CreatedAtAction(nameof(GetMedicineById), new { id = medicine.Id }, medicine);
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(ex.Message);
			}
		}

		[HttpPut("UpdateMedicine/{id}")]
		[Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
		public async Task<IActionResult> UpdateMedicine([FromRoute] int id, [FromBody] UpdateMedicineRequestDto dto)
		{
			try
			{
				var medicine = await _medicineService.UpdateMedicineAsync(id, dto);
				return Ok(medicine);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
		}

		[HttpDelete("DeleteMedicine/{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> DeleteMedicine([FromRoute] int id)
		{
			var result = await _medicineService.DeleteMedicineAsync(id);
			if (!result) return NotFound();
			return NoContent();
		}
	}
}
