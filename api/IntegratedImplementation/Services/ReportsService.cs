using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Reports;

namespace IntegratedImplementation.Services
{
    public class ReportsService : IReportsService
    {
        private readonly PharmacyDbContext _context;

        public ReportsService(PharmacyDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CurrentStockReportDto>> GetCurrentStockReportAsync(CancellationToken cancellationToken = default)
        {
            var medicines = await _context.Medicines
                .Include(m => m.Category)
                .Include(m => m.Batches)
                .Where(m => m.IsActive)
                .ToListAsync(cancellationToken);

            return medicines.Select(m => new CurrentStockReportDto
            {
                MedicineId = m.Id,
                MedicineName = m.Name,
                MedicineCode = m.Code,
                CategoryName = m.Category?.Name,
                TotalStock = m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity),
                ReorderLevel = m.ReorderLevel,
                IsLowStock = m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity) <= m.ReorderLevel && m.ReorderLevel > 0,
                UnitPrice = m.UnitPrice
            }).OrderBy(r => r.MedicineName).ToList();
        }

        public async Task<IEnumerable<NearExpiryReportDto>> GetNearExpiryReportAsync(int daysThreshold = 30, CancellationToken cancellationToken = default)
        {
            var thresholdDate = DateTime.UtcNow.Date.AddDays(daysThreshold);
            var today = DateTime.UtcNow.Date;

            var batches = await _context.MedicineBatches
                .Include(b => b.Medicine)
                .Where(b => b.IsActive
                    && b.Quantity > 0
                    && b.ExpiryDate >= today
                    && b.ExpiryDate <= thresholdDate)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(cancellationToken);

            return batches.Select(b => new NearExpiryReportDto
            {
                BatchId = b.Id,
                MedicineId = b.MedicineId,
                MedicineName = b.Medicine.Name,
                MedicineCode = b.Medicine.Code,
                BatchNumber = b.BatchNumber,
                ExpiryDate = b.ExpiryDate,
                DaysUntilExpiry = (b.ExpiryDate.Date - today).Days,
                RemainingQuantity = b.Quantity,
                PurchasePrice = b.PurchasePrice,
                SellingPrice = b.SellingPrice
            }).ToList();
        }

        public async Task<IEnumerable<ExpiredReportDto>> GetExpiredReportAsync(CancellationToken cancellationToken = default)
        {
            var today = DateTime.UtcNow.Date;

            var batches = await _context.MedicineBatches
                .Include(b => b.Medicine)
                .Where(b => b.IsActive
                    && b.Quantity > 0
                    && b.ExpiryDate < today)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(cancellationToken);

            return batches.Select(b => new ExpiredReportDto
            {
                BatchId = b.Id,
                MedicineId = b.MedicineId,
                MedicineName = b.Medicine.Name,
                MedicineCode = b.Medicine.Code,
                BatchNumber = b.BatchNumber,
                ExpiryDate = b.ExpiryDate,
                DaysExpired = (today - b.ExpiryDate.Date).Days,
                RemainingQuantity = b.Quantity,
                PurchasePrice = b.PurchasePrice,
                FinancialLoss = b.Quantity * b.PurchasePrice
            }).ToList();
        }

        public async Task<IEnumerable<DailySalesReportDto>> GetDailySalesReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            var query = _context.Sales
                .Where(s => !s.IsCancelled)
                .AsQueryable();

            if (fromDate.HasValue)
            {
                var from = fromDate.Value.Date;
                query = query.Where(s => s.SaleDate >= from);
            }

            if (toDate.HasValue)
            {
                var to = toDate.Value.Date.AddDays(1);
                query = query.Where(s => s.SaleDate < to);
            }

            var sales = await query.ToListAsync(cancellationToken);

            var dailyGroups = sales
                .GroupBy(s => s.SaleDate.Date)
                .Select(g => new DailySalesReportDto
                {
                    Date = g.Key,
                    TransactionCount = g.Count(),
                    TotalRevenue = g.Sum(s => s.TotalAmount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            return dailyGroups;
        }

        public async Task<IEnumerable<MonthlySalesReportDto>> GetMonthlySalesReportAsync(int? year, CancellationToken cancellationToken = default)
        {
            var query = _context.Sales
                .Where(s => !s.IsCancelled)
                .AsQueryable();

            if (year.HasValue)
            {
                query = query.Where(s => s.SaleDate.Year == year.Value);
            }

            var sales = await query.ToListAsync(cancellationToken);

            var monthlyGroups = sales
                .GroupBy(s => new { s.SaleDate.Year, s.SaleDate.Month })
                .Select(g => new MonthlySalesReportDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                    TransactionCount = g.Count(),
                    TotalRevenue = g.Sum(s => s.TotalAmount)
                })
                .OrderBy(m => m.Year)
                .ThenBy(m => m.Month)
                .ToList();

            return monthlyGroups;
        }

        public async Task<IEnumerable<PurchaseHistoryReportDto>> GetPurchaseHistoryReportAsync(DateTime? fromDate, DateTime? toDate, int? supplierId, int? medicineId, CancellationToken cancellationToken = default)
        {
            var query = _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                .ThenInclude(i => i.MedicineBatch)
                .ThenInclude(b => b != null ? b.Medicine : null)
                .AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(p => p.PurchaseDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                var to = toDate.Value.Date.AddDays(1);
                query = query.Where(p => p.PurchaseDate < to);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId.Value);
            }

            var purchases = await query.ToListAsync(cancellationToken);

            var result = new List<PurchaseHistoryReportDto>();

            foreach (var purchase in purchases)
            {
                foreach (var item in purchase.Items)
                {
                    // Filter by medicineId if provided
                    if (medicineId.HasValue)
                    {
                        var itemMedicineId = item.MedicineId ?? item.MedicineBatch?.MedicineId;
                        if (itemMedicineId != medicineId.Value)
                            continue;
                    }

                    result.Add(new PurchaseHistoryReportDto
                    {
                        PurchaseId = purchase.Id,
                        InvoiceNumber = purchase.InvoiceNumber,
                        PurchaseDate = purchase.PurchaseDate,
                        SupplierId = purchase.SupplierId,
                        SupplierName = purchase.Supplier?.Name ?? "Unknown",
                        ItemId = item.Id,
                        MedicineId = item.MedicineId ?? item.MedicineBatch?.MedicineId,
                        MedicineName = item.MedicineBatch?.Medicine?.Name,
                        MedicineCode = item.MedicineBatch?.Medicine?.Code,
                        BatchNumber = item.BatchNumber ?? item.MedicineBatch?.BatchNumber,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        UnitCost = item.UnitCost,
                        LineTotal = item.Quantity * item.UnitPrice,
                        PurchaseTotalAmount = purchase.TotalAmount
                    });
                }
            }

            return result.OrderByDescending(r => r.PurchaseDate).ToList();
        }

        public async Task<byte[]> ExportReportAsync(ExportReportRequestDto request, CancellationToken cancellationToken = default)
        {
            IEnumerable<object> data = request.ReportType.ToLower() switch
            {
                "current-stock" => await GetCurrentStockReportAsync(cancellationToken),
                "near-expiry" => await GetNearExpiryReportAsync(30, cancellationToken),
                "expired" => await GetExpiredReportAsync(cancellationToken),
                "sales-daily" => await GetDailySalesReportAsync(request.FromDate, request.ToDate, cancellationToken),
                "sales-monthly" => await GetMonthlySalesReportAsync(request.FromDate?.Year, cancellationToken),
                "purchase-history" => await GetPurchaseHistoryReportAsync(request.FromDate, request.ToDate, request.SupplierId, request.MedicineId, cancellationToken),
                _ => throw new InvalidOperationException($"Unknown report type: {request.ReportType}")
            };

            return request.Format.ToLower() switch
            {
                "csv" => GenerateCsv(data),
                "excel" => GenerateCsv(data), // For now, return CSV. Excel generation would require a library like EPPlus
                "pdf" => GenerateCsv(data), // For now, return CSV. PDF generation would require a library like iTextSharp
                _ => throw new InvalidOperationException($"Unsupported export format: {request.Format}")
            };
        }

        private byte[] GenerateCsv(IEnumerable<object> data)
        {
            var list = data.ToList();
            if (list.Count == 0)
                return Encoding.UTF8.GetBytes("No data available\n");

            var sb = new StringBuilder();

            // Get headers from first object's properties
            var firstItem = list.First();
            var properties = firstItem.GetType().GetProperties();
            var headers = properties.Select(p => p.Name).ToList();
            sb.AppendLine(string.Join(",", headers));

            // Add data rows
            foreach (var item in list)
            {
                var values = properties.Select(p =>
                {
                    var value = p.GetValue(item);
                    if (value == null) return "";
                    var str = value.ToString();
                    // Escape commas and quotes in CSV
                    if (str.Contains(",") || str.Contains("\"") || str.Contains("\n"))
                        return $"\"{str.Replace("\"", "\"\"")}\"";
                    return str;
                });
                sb.AppendLine(string.Join(",", values));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
    }
}
