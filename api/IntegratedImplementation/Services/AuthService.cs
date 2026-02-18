using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Auth;

namespace IntegratedImplementation.Services
{
    public class AuthService : IAuthService
    {
        private readonly PharmacyDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthService(
            PharmacyDbContext context,
            IConfiguration configuration,
            IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null || !user.IsActive)
                throw new UnauthorizedAccessException("Invalid credentials");

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.Password);

            if (passwordResult == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException("Invalid credentials");

            var accessToken = GenerateAccessToken(user);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30)
            };
        }

        private string GenerateAccessToken(User user)
        {
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
            var issuer = _configuration["Jwt:Issuer"] ?? "pharmacy";
            var audience = _configuration["Jwt:Audience"] ?? "pharmacy_clients";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("fullName", user.FullName ?? string.Empty)
            };

            if (user.UserRoles != null)
            {
                var roleClaims = user.UserRoles
                    .Where(ur => ur.Role != null && !string.IsNullOrEmpty(ur.Role.Name))
                    .Select(ur => new Claim(ClaimTypes.Role, ur.Role!.Name!));

                claims.AddRange(roleClaims);
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var expiresMinutes = double.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "30");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = credentials
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var random = new byte[64];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(random);
            return Convert.ToBase64String(random);
        }
    }
}
