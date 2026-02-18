using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Role;

namespace IntegratedImplementation.Services
{
    public class RoleService : IRoleService
    {
        private readonly PharmacyDbContext _context;
        private static readonly string[] SystemRoles = { "Admin", "Pharmacist", "Cashier", "Viewer" };

        public RoleService(PharmacyDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RoleResponseDto>> GetAllRolesAsync()
        {
            var roles = await _context.Roles
                .Include(r => r.UserRoles)
                .ToListAsync();

            return roles.Select(r => new RoleResponseDto
            {
                Id = r.Id,
                Name = r.Name,
                UserCount = r.UserRoles.Count,
                CreatedAt = r.CreatedAt
            });
        }

        public async Task<RoleResponseDto> GetRoleByIdAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
                throw new KeyNotFoundException($"Role with ID {id} not found");

            return new RoleResponseDto
            {
                Id = role.Id,
                Name = role.Name,
                UserCount = role.UserRoles.Count,
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<RoleResponseDto> CreateRoleAsync(CreateRoleRequestDto dto)
        {
            // Check if role name already exists
            var existingRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == dto.Name);

            if (existingRole != null)
                throw new InvalidOperationException($"Role '{dto.Name}' already exists");

            var role = new Role
            {
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return new RoleResponseDto
            {
                Id = role.Id,
                Name = role.Name,
                UserCount = 0,
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
                return false;

            // Prevent deletion of system roles
            if (SystemRoles.Contains(role.Name))
                throw new InvalidOperationException($"Cannot delete system role '{role.Name}'");

            // Check if role has users
            if (role.UserRoles.Any())
                throw new InvalidOperationException($"Cannot delete role '{role.Name}' because it has {role.UserRoles.Count} user(s) assigned");

            // Hard delete
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
