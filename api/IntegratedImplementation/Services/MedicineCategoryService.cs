using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Medicines;

namespace IntegratedImplementation.Services
{
    public class MedicineCategoryService : IMedicineCategoryService
    {
        private readonly PharmacyDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public MedicineCategoryService(PharmacyDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<MedicineCategoryDto>> GetAllCategoriesAsync()
        {
            return await _context.MedicineCategories
                .Select(c => new MedicineCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }

        public async Task<MedicineCategoryDto> GetCategoryByIdAsync(int id)
        {
            var category = await _context.MedicineCategories.FindAsync(id);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {id} not found");

            return new MedicineCategoryDto
            {
                Id = category.Id,
                Name = category.Name
            };
        }

        public async Task<MedicineCategoryDto> CreateCategoryAsync(CreateMedicineCategoryDto dto)
        {
            var category = new MedicineCategory
            {
                Name = dto.Name,
                CreatedAt = System.DateTime.UtcNow
            };

            _context.MedicineCategories.Add(category);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "CreateCategory", "MedicineCategory", category.Id, null, System.Text.Json.JsonSerializer.Serialize(dto));

            return new MedicineCategoryDto
            {
                Id = category.Id,
                Name = category.Name
            };
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.MedicineCategories.FindAsync(id);
            if (category == null) return false;

            // Check if there are medicines in this category
            var hasMedicines = await _context.Medicines.AnyAsync(m => m.CategoryId == id);
            if (hasMedicines)
                throw new System.InvalidOperationException("Cannot delete category with associated medicines");

            _context.MedicineCategories.Remove(category);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "DeleteCategory", "MedicineCategory", id, System.Text.Json.JsonSerializer.Serialize(category), "DELETED");
            return true;
        }
    }
}
