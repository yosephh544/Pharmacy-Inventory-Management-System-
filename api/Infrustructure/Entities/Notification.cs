using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Notification : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; } = false;
    }
}
