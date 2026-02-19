using System.Collections.Generic;
using System.Threading.Tasks;
using IntegratedImplementation.DTOs.Medicines;

namespace IntegratedImplementation.Interfaces
{
    public interface IMedicineService
    {
        Task<IEnumerable<MedicineListItemDto>> GetAllMedicinesAsync();
        Task<MedicineResponseDto> GetMedicineByIdAsync(int id);
        Task<MedicineResponseDto> CreateMedicineAsync(CreateMedicineRequestDto dto);
        Task<MedicineResponseDto> UpdateMedicineAsync(int id, UpdateMedicineRequestDto dto);
        Task<bool> DeleteMedicineAsync(int id);
    }
}
