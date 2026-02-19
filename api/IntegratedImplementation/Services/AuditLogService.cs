using System;
using System.Threading.Tasks;
using Infrustructure.Entities;
using IntegratedImplementation.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Pharmacy.Infrastructure.Data;

namespace IntegratedImplementation.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly PharmacyDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<AuditLogService> _logger;

        public AuditLogService(
            PharmacyDbContext context, 
            IHttpContextAccessor httpContextAccessor,
            ILogger<AuditLogService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public async Task LogActionAsync(int? userId, string action, string entityName, int entityId, string? oldValues = null, string? newValues = null)
        {
            try
            {
                // If userId is not provided, try to get it from current authenticated user
                var actorId = userId ?? GetCurrentUserId();
                
                // If we still don't have an ID (e.g. system action or pre-auth), we might need a default or allow null if entity supports it
                // For now, if no user is found, we can't save the log due to FK constraint on UserId
                if (actorId == 0)
                {
                    _logger.LogWarning("Could not determine Actor ID for audit log. Action: {Action}", action);
                    return;
                }

                var ipAddress = GetClientIpAddress();

                var log = new AuditLog
                {
                    UserId = actorId,
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    OldValues = oldValues,
                    NewValues = newValues,
                    IPAddress = ipAddress,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Never break main logic if logging fails
                _logger.LogError(ex, "Failed to create audit log for action {Action} on entity {EntityName}", action, entityName);
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int id))
            {
                return id;
            }
            return 0;
        }

        private string? GetClientIpAddress()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // Check for X-Forwarded-For header (standard for proxies/load balancers)
            if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                var ip = forwardedFor.ToString().Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(ip)) return ip;
            }

            return httpContext.Connection.RemoteIpAddress?.ToString();
        }
    }
}
