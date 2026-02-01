using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class AuditLog : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public string Action { get; set; } = null!;
        public string EntityName { get; set; } = null!;
        public int EntityId { get; set; }

        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
    }
}
