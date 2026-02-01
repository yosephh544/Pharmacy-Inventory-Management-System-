using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class User : BaseEntity
    {
        public string FullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;

        public int PharmacyProfileId { get; set; }
        public PharmacyProfile PharmacyProfile { get; set; } = null!;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
