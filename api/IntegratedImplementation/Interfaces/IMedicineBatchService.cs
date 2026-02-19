using System.Collections.Generic;
using System.Threading.Tasks;
using IntegratedImplementation.DTOs.Batches;

namespace IntegratedImplementation.Interfaces
{
    public interface IMedicineBatchService
    {
        Task<IEnumerable<BatchListItemDto>> GetBatchesByMedicineIdAsync(int medicineId);
        Task<BatchResponseDto> GetBatchByIdAsync(int id);
        Task<BatchResponseDto> CreateBatchAsync(CreateBatchRequestDto dto);
        Task<BatchResponseDto> UpdateBatchAsync(int id, UpdateBatchRequestDto dto);
        Task<bool> DeleteBatchAsync(int id);
        Task<bool> AdjustStockAsync(int id, AdjustStockRequestDto dto);
    }
}
