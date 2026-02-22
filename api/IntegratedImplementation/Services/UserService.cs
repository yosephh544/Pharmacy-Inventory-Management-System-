using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.User;

namespace IntegratedImplementation.Services
{
    public class UserService : IUserService
    {
        private readonly PharmacyDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IAuditLogService _auditLogService;

        public UserService(
            PharmacyDbContext context,
            IPasswordHasher<User> passwordHasher,
            IAuditLogService auditLogService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<UserListItemDto>> GetAllUsersAsync()
        {
            // Return all users (active + inactive) so the UI
            // can show their current status and optionally re-activate them.
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .ToListAsync();

            return users.Select(u => new UserListItemDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Username = u.Username,
                IsActive = u.IsActive,
                Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
            });
        }

        public async Task<UserResponseDto> GetUserByIdAsync(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                throw new KeyNotFoundException($"User with ID {id} not found");

            return new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                IsActive = user.IsActive,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto dto)
        {
            // Check if username already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (existingUser != null)
                throw new InvalidOperationException($"Username '{dto.Username}' already exists");

            // Validate pharmacy profile exists BEFORE hitting the FK constraint
            if (dto.PharmacyProfileId <= 0 ||
                !await _context.Set<PharmacyProfile>().AnyAsync(p => p.Id == dto.PharmacyProfileId))
            {
                throw new InvalidOperationException(
                    $"Pharmacy profile with ID {dto.PharmacyProfileId} does not exist");
            }

            // Validate roles exist (avoid OPENJSON translation for older SQL Server)
            var roles = new List<Role>();
            foreach (var roleId in dto.RoleIds)
            {
                var role = await _context.Roles.FindAsync(roleId);
                if (role != null)
                {
                    roles.Add(role);
                }
            }

            if (roles.Count != dto.RoleIds.Count)
                throw new InvalidOperationException("One or more role IDs are invalid");

            // Create user entity
            var user = new User
            {
                FullName = dto.FullName,
                Username = dto.Username,
                PharmacyProfileId = dto.PharmacyProfileId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Hash password
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            // Add user to context
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assign roles
            foreach (var roleId in dto.RoleIds)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = roleId
                });
            }

            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(null, "CreateUser", "User", user.Id, null, System.Text.Json.JsonSerializer.Serialize(new { user.Username, user.FullName, Roles = roles.Select(r => r.Name) }));

            // Reload user with roles
            var createdUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstAsync(u => u.Id == user.Id);

            return new UserResponseDto
            {
                Id = createdUser.Id,
                FullName = createdUser.FullName,
                Username = createdUser.Username,
                IsActive = createdUser.IsActive,
                Roles = createdUser.UserRoles.Select(ur => ur.Role.Name).ToList(),
                CreatedAt = createdUser.CreatedAt
            };
        }

        public async Task<UserResponseDto> UpdateUserAsync(int id, UpdateUserRequestDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                throw new KeyNotFoundException($"User with ID {id} not found");

            // Capture old state for audit log
            var oldState = new
            {
                user.FullName,
                user.IsActive,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
            };

            // Update fields if provided
            if (dto.FullName != null)
                user.FullName = dto.FullName;

            bool activated = false;
            if (dto.IsActive.HasValue)
            {
                if (!user.IsActive && dto.IsActive.Value)
                    activated = true;
                user.IsActive = dto.IsActive.Value;
            }

            // Update roles if provided
            if (dto.RoleIds != null)
            {
                // Validate roles exist (avoid OPENJSON translation for older SQL Server)
                var roles = new List<Role>();
                foreach (var roleId in dto.RoleIds)
                {
                    var role = await _context.Roles.FindAsync(roleId);
                    if (role != null)
                    {
                        roles.Add(role);
                    }
                }

                if (roles.Count != dto.RoleIds.Count)
                    throw new InvalidOperationException("One or more role IDs are invalid");

                // Remove existing roles
                _context.UserRoles.RemoveRange(user.UserRoles);

                // Add new roles
                foreach (var roleId in dto.RoleIds)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = roleId
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Capture new state for audit log
            var newState = new
            {
                updatedUserSnapshot = await _context.Users
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                    .Where(u => u.Id == id)
                    .Select(u => new { u.FullName, u.IsActive, Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList() })
                    .FirstOrDefaultAsync()
            };

            var actionName = activated ? "ActivateUser" : "UpdateUser";
            await _auditLogService.LogActionAsync(
                null, 
                actionName, 
                "User", 
                id, 
                System.Text.Json.JsonSerializer.Serialize(oldState), 
                System.Text.Json.JsonSerializer.Serialize(newState.updatedUserSnapshot));

            // Reload user with updated roles
            var updatedUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstAsync(u => u.Id == id);

            return new UserResponseDto
            {
                Id = updatedUser.Id,
                FullName = updatedUser.FullName,
                Username = updatedUser.Username,
                IsActive = updatedUser.IsActive,
                Roles = updatedUser.UserRoles.Select(ur => ur.Role.Name).ToList(),
                CreatedAt = updatedUser.CreatedAt
            };
        }

        public async Task<bool> DeactivateUserAsync(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return false;

            var oldState = new { user.FullName, user.IsActive, Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList() };

            user.IsActive = false;
            await _context.SaveChangesAsync();

            var newState = new { user.FullName, user.IsActive, Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList() };

            await _auditLogService.LogActionAsync(
                null, 
                "DeactivateUser", 
                "User", 
                id, 
                System.Text.Json.JsonSerializer.Serialize(oldState), 
                System.Text.Json.JsonSerializer.Serialize(newState));

            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequestDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {userId} not found");

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new InvalidOperationException("New password and confirmation password do not match");

            // Verify old password
            var passwordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.OldPassword);
            if (passwordResult == PasswordVerificationResult.Failed)
                throw new InvalidOperationException("Invalid old password");

            // Hash and save new password
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            await _context.SaveChangesAsync();

            await _auditLogService.LogActionAsync(userId, "ChangePassword", "User", userId);
            
            return true;
        }
    }
}
