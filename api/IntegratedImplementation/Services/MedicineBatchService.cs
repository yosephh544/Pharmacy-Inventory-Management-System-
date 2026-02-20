using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Batches;
using System.Text.Json;

namespace IntegratedImplementation.Services
{
    public class MedicineBatchService : IMedicineBatchService
    {
        private readonly PharmacyDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public MedicineBatchService(PharmacyDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<BatchListItemDto>> GetBatchesByMedicineIdAsync(int medicineId)
        {
            return await _context.Set<MedicineBatch>()
                .Where(b => b.MedicineId == medicineId)
                .Select(b => new BatchListItemDto
                {
                    Id = b.Id,
                    BatchNumber = b.BatchNumber,
                    ExpiryDate = b.ExpiryDate,
                    Quantity = b.Quantity,
                    PurchasePrice = b.PurchasePrice,
                    SellingPrice = b.SellingPrice,
                    IsActive = b.IsActive
                })
                .ToListAsync();
        }

        public async Task<BatchResponseDto> GetBatchByIdAsync(int id)
        {
            var batch = await _context.Set<MedicineBatch>()
                .Include(b => b.Medicine)
                .Include(b => b.Supplier)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (batch == null)
                throw new KeyNotFoundException($"Batch with ID {id} not found");

            return MapToResponseDto(batch);
        }

        public async Task<BatchResponseDto> CreateBatchAsync(CreateBatchRequestDto dto)
        {
            var medicine = await _context.Medicines.FindAsync(dto.MedicineId);
            if (medicine == null)
                throw new InvalidOperationException("Invalid Medicine ID");

            // If SupplierId is 0 or not provided, fall back to a default/first supplier
            var supplierId = dto.SupplierId;
            if (supplierId == 0)
            {
                var defaultSupplier = await _context.Suppliers.FirstOrDefaultAsync();
                if (defaultSupplier == null)
                    throw new InvalidOperationException("No supplier is configured. Please create a supplier or provide a valid SupplierId.");

                supplierId = defaultSupplier.Id;
            }

            var batch = new MedicineBatch
            {
                MedicineId = dto.MedicineId,
                BatchNumber = dto.BatchNumber,
                ExpiryDate = dto.ExpiryDate,
                Quantity = dto.Quantity,
                PurchasePrice = dto.PurchasePrice,
                SellingPrice = dto.SellingPrice,
                SupplierId = supplierId,
                ReceivedDate = dto.ReceivedDate ?? DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<MedicineBatch>().Add(batch);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "CreateBatch", "MedicineBatch", batch.Id, null, JsonSerializer.Serialize(dto));

            return await GetBatchByIdAsync(batch.Id);
        }

        public async Task<BatchResponseDto> UpdateBatchAsync(int id, UpdateBatchRequestDto dto)
        {
            var batch = await _context.Set<MedicineBatch>()
                .Include(b => b.Medicine)
                .Include(b => b.Supplier)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (batch == null)
                throw new KeyNotFoundException($"Batch with ID {id} not found");

            var oldState = JsonSerializer.Serialize(MapToResponseDto(batch));

            if (dto.BatchNumber != null) batch.BatchNumber = dto.BatchNumber;
            if (dto.ExpiryDate.HasValue) batch.ExpiryDate = dto.ExpiryDate.Value;
            if (dto.Quantity.HasValue) batch.Quantity = dto.Quantity.Value;
            if (dto.PurchasePrice.HasValue) batch.PurchasePrice = dto.PurchasePrice.Value;
            if (dto.SellingPrice.HasValue) batch.SellingPrice = dto.SellingPrice.Value;
            if (dto.SupplierId.HasValue)
            {
                var supplierId = dto.SupplierId.Value;
                if (supplierId == 0)
                {
                    var defaultSupplier = await _context.Suppliers.FirstOrDefaultAsync();
                    if (defaultSupplier == null)
                        throw new InvalidOperationException("No supplier is configured. Please create a supplier or provide a valid SupplierId.");

                    supplierId = defaultSupplier.Id;
                }

                batch.SupplierId = supplierId;
            }
            if (dto.IsActive.HasValue) batch.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();

            var newState = JsonSerializer.Serialize(MapToResponseDto(batch));
            await _auditLogService.LogActionAsync(null, "UpdateBatch", "MedicineBatch", batch.Id, oldState, newState);

            return MapToResponseDto(batch);
        }

        public async Task<bool> DeleteBatchAsync(int id)
        {
            var batch = await _context.Set<MedicineBatch>().FindAsync(id);
            if (batch == null) return false;

            // Optional: Block delete if already used in sales/transactions
            // For now, simple soft-delete or hard delete if user prefers
            _context.Set<MedicineBatch>().Remove(batch);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "DeleteBatch", "MedicineBatch", id, JsonSerializer.Serialize(batch), "DELETED");
            return true;
        }

        public async Task<bool> AdjustStockAsync(int id, AdjustStockRequestDto dto)
        {
            var batch = await _context.Set<MedicineBatch>().FindAsync(id);
            if (batch == null) return false;

            var oldQuantity = batch.Quantity;
            batch.Quantity = dto.NewQuantity;

            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(
                null, 
                "AdjustStock", 
                "MedicineBatch", 
                id, 
                $"{{\"Quantity\": {oldQuantity}}}", 
                $"{{\"Quantity\": {batch.Quantity}, \"Reason\": \"{dto.Reason}\"}}");

            return true;
        }

        private BatchResponseDto MapToResponseDto(MedicineBatch b)
        {
            return new BatchResponseDto
            {
                Id = b.Id,
                MedicineId = b.MedicineId,
                MedicineName = b.Medicine?.Name ?? "Unknown",
                BatchNumber = b.BatchNumber,
                ExpiryDate = b.ExpiryDate,
                Quantity = b.Quantity,
                PurchasePrice = b.PurchasePrice,
                SellingPrice = b.SellingPrice,
                ReceivedDate = b.ReceivedDate,
                SupplierId = b.SupplierId,
                SupplierName = b.Supplier?.Name,
                IsActive = b.IsActive
            };
        }
    }
}
