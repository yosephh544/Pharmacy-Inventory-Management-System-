using IntegratedImplementation.DTOs.Reports;

namespace IntegratedImplementation.Interfaces
{
    public interface IReportsService
    {
        Task<IEnumerable<CurrentStockReportDto>> GetCurrentStockReportAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<NearExpiryReportDto>> GetNearExpiryReportAsync(int daysThreshold = 30, CancellationToken cancellationToken = default);
        Task<IEnumerable<ExpiredReportDto>> GetExpiredReportAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<DailySalesReportDto>> GetDailySalesReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
        Task<IEnumerable<MonthlySalesReportDto>> GetMonthlySalesReportAsync(int? year, CancellationToken cancellationToken = default);
        Task<IEnumerable<PurchaseHistoryReportDto>> GetPurchaseHistoryReportAsync(DateTime? fromDate, DateTime? toDate, int? supplierId, int? medicineId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportReportAsync(ExportReportRequestDto request, CancellationToken cancellationToken = default);
    }
}
