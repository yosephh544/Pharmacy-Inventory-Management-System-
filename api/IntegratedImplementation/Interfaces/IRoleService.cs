using IntegratedImplementation.DTOs.Role;

namespace IntegratedImplementation.Interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleResponseDto>> GetAllRolesAsync();
        Task<RoleResponseDto> GetRoleByIdAsync(int id);
        Task<RoleResponseDto> CreateRoleAsync(CreateRoleRequestDto dto);
        Task<bool> DeleteRoleAsync(int id);
    }
}
