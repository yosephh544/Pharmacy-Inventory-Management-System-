namespace IntegratedImplementation.DTOs.Auth
{
    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; }
    }
