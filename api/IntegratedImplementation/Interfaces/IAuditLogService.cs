using System.Threading.Tasks;

namespace IntegratedImplementation.Interfaces
{
    public interface IAuditLogService
    {
        Task LogActionAsync(int? userId, string action, string entityName, int entityId, string? oldValues = null, string? newValues = null);
    }
}
