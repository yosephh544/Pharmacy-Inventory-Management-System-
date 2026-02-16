using System;
using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class RefreshToken : BaseEntity
    {
        public int UserId { get; set; }
        public User? User { get; set; }

        public string Token { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
