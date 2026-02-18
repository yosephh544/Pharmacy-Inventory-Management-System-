using IntegratedImplementation.DTOs.User;

namespace IntegratedImplementation.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserListItemDto>> GetAllUsersAsync();
        Task<UserResponseDto> GetUserByIdAsync(int id);
        Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto dto);
        Task<UserResponseDto> UpdateUserAsync(int id, UpdateUserRequestDto dto);
        Task<bool> DeactivateUserAsync(int id);
    }
}
