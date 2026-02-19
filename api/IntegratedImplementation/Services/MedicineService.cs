using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Medicines;
using System.Text.Json;

namespace IntegratedImplementation.Services
{
    public class MedicineService : IMedicineService
    {
        private readonly PharmacyDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public MedicineService(PharmacyDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<MedicineListItemDto>> GetAllMedicinesAsync()
        {
            return await _context.Medicines
                .Include(m => m.Category)
                .Include(m => m.Batches)
                .Select(m => new MedicineListItemDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Code = m.Code,
                    GenericName = m.GenericName,
                    CategoryName = m.Category.Name,
                    TotalStock = m.Batches.Sum(b => b.Quantity),
                    IsActive = m.IsActive
                })
                .ToListAsync();
        }

        public async Task<MedicineResponseDto> GetMedicineByIdAsync(int id)
        {
            var medicine = await _context.Medicines
                .Include(m => m.Category)
                .Include(m => m.Batches)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (medicine == null)
                throw new KeyNotFoundException($"Medicine with ID {id} not found");

            return MapToResponseDto(medicine);
        }

        public async Task<MedicineResponseDto> CreateMedicineAsync(CreateMedicineRequestDto dto)
        {
            var category = await _context.Set<MedicineCategory>().FindAsync(dto.CategoryId);
            if (category == null)
                throw new InvalidOperationException("Invalid Category ID");

            var medicine = new Medicine
                {
                    Name = dto.Name,
                    Code = dto.Code,
                    GenericName = dto.GenericName,
                    Strength = dto.Strength,
                    Manufacturer = dto.Manufacturer,
                    ReorderLevel = dto.ReorderLevel,
                    RequiresPrescription = dto.RequiresPrescription,
                    CategoryId = dto.CategoryId,
                    UnitPrice = dto.UnitPrice,
                    IsActive = true
                };

            _context.Medicines.Add(medicine);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "CreateMedicine", "Medicine", medicine.Id, null, JsonSerializer.Serialize(dto));

            return await GetMedicineByIdAsync(medicine.Id);
        }

        public async Task<MedicineResponseDto> UpdateMedicineAsync(int id, UpdateMedicineRequestDto dto)
        {
            var medicine = await _context.Medicines
                .Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (medicine == null)
                throw new KeyNotFoundException($"Medicine with ID {id} not found");

            var oldState = JsonSerializer.Serialize(MapToResponseDto(medicine));

            if (dto.Name != null) medicine.Name = dto.Name;
            if (dto.GenericName != null) medicine.GenericName = dto.GenericName;
            if (dto.Strength != null) medicine.Strength = dto.Strength;
            if (dto.Manufacturer != null) medicine.Manufacturer = dto.Manufacturer;
            if (dto.ReorderLevel.HasValue) medicine.ReorderLevel = dto.ReorderLevel.Value;
            if (dto.RequiresPrescription.HasValue) medicine.RequiresPrescription = dto.RequiresPrescription.Value;
            if (dto.CategoryId.HasValue) medicine.CategoryId = dto.CategoryId.Value;
            if (dto.UnitPrice.HasValue) medicine.UnitPrice = dto.UnitPrice.Value;
            if (dto.IsActive.HasValue) medicine.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();

            var newState = JsonSerializer.Serialize(MapToResponseDto(medicine));
            await _auditLogService.LogActionAsync(null, "UpdateMedicine", "Medicine", medicine.Id, oldState, newState);

            return MapToResponseDto(medicine);
        }

        public async Task<bool> DeleteMedicineAsync(int id)
        {
            var medicine = await _context.Medicines.FindAsync(id);
            if (medicine == null) return false;

            var oldState = JsonSerializer.Serialize(MapToResponseDto(medicine));
            
            // Soft delete
            medicine.IsActive = false;
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "DeleteMedicine", "Medicine", id, oldState, "{\"IsActive\": false}");
            return true;
        }

        private MedicineResponseDto MapToResponseDto(Medicine m)
        {
            return new MedicineResponseDto
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                GenericName = m.GenericName,
                Strength = m.Strength,
                Manufacturer = m.Manufacturer,
                ReorderLevel = m.ReorderLevel,
                RequiresPrescription = m.RequiresPrescription,
                IsActive = m.IsActive,
                UnitPrice = m.UnitPrice,
                CategoryId = m.CategoryId,
                CategoryName = m.Category?.Name,
                TotalStock = m.Batches?.Sum(b => b.Quantity) ?? 0
            };
        }
    }
}
