namespace IntegratedImplementation.DTOs.Auth
{
    public class LoginRequestDto
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = null!;
    }
}
