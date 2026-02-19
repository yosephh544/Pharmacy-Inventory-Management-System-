using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Medicines;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/medicine-categories")]
     [Authorize]
    public class MedicineCategoriesController : ControllerBase
    {
        private readonly IMedicineCategoryService _categoryService;

        public MedicineCategoriesController(IMedicineCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet("GetAllCategories")]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        [HttpGet("GetCategoryById/{id}")]
        public async Task<IActionResult> GetCategoryById([FromRoute] int id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);
                return Ok(category);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("CreateCategory")]
        [Authorize(Roles = "Admin,Storekeeper,Pharmacist")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateMedicineCategoryDto dto)
        {
            var category = await _categoryService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
        }

        [HttpDelete("DeleteCategory/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory([FromRoute] int id)
        {
            try
            {
                var result = await _categoryService.DeleteCategoryAsync(id);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
