using System.Collections.Generic;
using System.Threading.Tasks;
using IntegratedImplementation.DTOs.Medicines;

namespace IntegratedImplementation.Interfaces
{
    public interface IMedicineCategoryService
    {
        Task<IEnumerable<MedicineCategoryDto>> GetAllCategoriesAsync();
        Task<MedicineCategoryDto> GetCategoryByIdAsync(int id);
        Task<MedicineCategoryDto> CreateCategoryAsync(CreateMedicineCategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);
    }
}
