using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Sales;

namespace IntegratedImplementation.Services
{
    public class SalesService : ISalesService
    {
        private readonly PharmacyDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public SalesService(PharmacyDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<SaleResponseDto> CreateSaleAsync(CreateSaleRequestDto dto, int soldByUserId, CancellationToken cancellationToken = default)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new InvalidOperationException("Sale must have at least one item.");

            var today = DateTime.UtcNow.Date;

            // Validate all medicines exist and quantities are positive
            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                    throw new InvalidOperationException($"Quantity must be greater than zero for medicine ID {item.MedicineId}.");
                var medicine = await _context.Medicines.FindAsync(new object[] { item.MedicineId }, cancellationToken);
                if (medicine == null)
                    throw new InvalidOperationException($"Medicine with ID {item.MedicineId} not found.");
            }

            // Plan deductions: for each medicine, get FIFO batches (non-expired, active) and allocate
            var saleItemsToCreate = new List<(int MedicineBatchId, int Quantity, decimal UnitPrice)>();

            foreach (var line in dto.Items)
            {
                var batches = await _context.MedicineBatches
                    .Where(b => b.MedicineId == line.MedicineId
                        && b.IsActive
                        && b.ExpiryDate >= today
                        && b.Quantity > 0)
                    .OrderBy(b => b.ExpiryDate)
                    .ToListAsync(cancellationToken);

                var available = batches.Sum(b => b.Quantity);
                if (available < line.Quantity)
                    throw new InvalidOperationException(
                        $"Insufficient stock for medicine ID {line.MedicineId}. Available: {available}, requested: {line.Quantity}. Cannot sell expired or more than available.");

                var remaining = line.Quantity;
                foreach (var batch in batches)
                {
                    if (remaining <= 0) break;
                    var take = Math.Min(remaining, batch.Quantity);
                    saleItemsToCreate.Add((batch.Id, take, batch.SellingPrice));
                    remaining -= take;
                }
            }

            // Execute in a single transaction: create Sale, SaleItems, deduct batch quantities
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var sale = new Sale
                {
                    SaleDate = DateTime.UtcNow,
                    TotalAmount = 0,
                    PaymentMethod = dto.PaymentMethod,
                    IsCancelled = false,
                    CreatedByUserId = soldByUserId,
                    SoldByUserId = soldByUserId
                };
                _context.Sales.Add(sale);
                await _context.SaveChangesAsync(cancellationToken);

                decimal totalAmount = 0;
                foreach (var (medicineBatchId, quantity, unitPrice) in saleItemsToCreate)
                {
                    var batch = await _context.MedicineBatches.FindAsync(new object[] { medicineBatchId }, cancellationToken);
                    if (batch == null) throw new InvalidOperationException($"Batch {medicineBatchId} not found.");
                    if (batch.Quantity < quantity)
                        throw new InvalidOperationException($"Batch {medicineBatchId} quantity changed; cannot complete sale.");
                    batch.Quantity -= quantity;
                    var lineTotal = quantity * unitPrice;
                    totalAmount += lineTotal;
                    _context.SaleItems.Add(new SaleItem
                    {
                        SaleId = sale.Id,
                        MedicineBatchId = medicineBatchId,
                        Quantity = quantity,
                        UnitPrice = unitPrice
                    });
                }
                sale.TotalAmount = totalAmount;
                sale.InvoiceNumber = $"INV-{sale.Id}";
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                await _auditLogService.LogActionAsync(soldByUserId, "Create", "Sale", sale.Id, null, $"TotalAmount={sale.TotalAmount}");
                return await GetSaleByIdAsync(sale.Id, cancellationToken) ?? throw new InvalidOperationException("Sale created but could not load response.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<(IEnumerable<SaleResponseDto> Items, int TotalCount)> GetSalesAsync(DateTime? fromDate, DateTime? toDate, int? soldByUserId, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var query = _context.Sales
                .Include(s => s.Items)
                .ThenInclude(i => i.MedicineBatch)
                .ThenInclude(b => b!.Medicine)
                .Include(s => s.SoldByUser)
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(s => s.SaleDate >= fromDate.Value);
            if (toDate.HasValue)
            {
                var end = toDate.Value.Date.AddDays(1);
                query = query.Where(s => s.SaleDate < end);
            }
            if (soldByUserId.HasValue)
                query = query.Where(s => s.SoldByUserId == soldByUserId.Value);

            var totalCount = await query.CountAsync(cancellationToken);
            var list = await query
                .OrderByDescending(s => s.SaleDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = list.Select(MapToResponseDto);
            return (items, totalCount);
        }

        public async Task<SaleResponseDto?> GetSaleByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var sale = await _context.Sales
                .Include(s => s.Items)
                .ThenInclude(i => i.MedicineBatch)
                .ThenInclude(b => b!.Medicine)
                .Include(s => s.SoldByUser)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            return sale == null ? null : MapToResponseDto(sale);
        }

        public async Task CancelSaleAsync(int id, CancellationToken cancellationToken = default)
        {
            var sale = await _context.Sales
                .Include(s => s.Items)
                .ThenInclude(i => i.MedicineBatch)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (sale == null)
                throw new KeyNotFoundException($"Sale with ID {id} not found.");
            if (sale.IsCancelled)
                throw new InvalidOperationException("Sale is already cancelled.");

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                foreach (var item in sale.Items)
                {
                    var batch = item.MedicineBatch;
                    if (batch != null)
                    {
                        batch.Quantity += item.Quantity;
                    }
                }
                sale.IsCancelled = true;
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                await _auditLogService.LogActionAsync(null, "Cancel", "Sale", sale.Id, $"TotalAmount={sale.TotalAmount}", "IsCancelled=true");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private static SaleResponseDto MapToResponseDto(Sale s)
        {
            return new SaleResponseDto
            {
                Id = s.Id,
                InvoiceNumber = s.InvoiceNumber,
                SaleDate = s.SaleDate,
                TotalAmount = s.TotalAmount,
                PaymentMethod = s.PaymentMethod,
                IsCancelled = s.IsCancelled,
                CreatedByUserId = s.CreatedByUserId,
                SoldByUserId = s.SoldByUserId,
                SoldByUserName = s.SoldByUser?.Username,
                Items = s.Items.Select(i => new SaleItemResponseDto
                {
                    Id = i.Id,
                    SaleId = i.SaleId,
                    MedicineBatchId = i.MedicineBatchId,
                    MedicineName = i.MedicineBatch?.Medicine?.Name,
                    MedicineCode = i.MedicineBatch?.Medicine?.Code,
                    BatchNumber = i.MedicineBatch?.BatchNumber,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };
        }
    }
}
