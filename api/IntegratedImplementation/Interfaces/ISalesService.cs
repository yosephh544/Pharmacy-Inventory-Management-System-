using IntegratedImplementation.DTOs.Sales;

namespace IntegratedImplementation.Interfaces
{
    public interface ISalesService
    {
        Task<SaleResponseDto> CreateSaleAsync(CreateSaleRequestDto dto, int soldByUserId, CancellationToken cancellationToken = default);
        Task<(IEnumerable<SaleResponseDto> Items, int TotalCount)> GetSalesAsync(DateTime? fromDate, DateTime? toDate, int? soldByUserId, int page, int pageSize, CancellationToken cancellationToken = default);
        Task<SaleResponseDto?> GetSaleByIdAsync(int id, CancellationToken cancellationToken = default);
        Task CancelSaleAsync(int id, CancellationToken cancellationToken = default);
    }
}
