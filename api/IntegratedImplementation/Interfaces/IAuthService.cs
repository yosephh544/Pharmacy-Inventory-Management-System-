using System.Threading.Tasks;
using IntegratedImplementation.DTOs.Auth;

namespace IntegratedImplementation.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(string refreshToken);
    }
}

