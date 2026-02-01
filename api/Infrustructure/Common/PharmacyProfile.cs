using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class PharmacyProfile : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Code { get; set; } = null!; // Unique per utility
        public string Address { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? Email { get; set; }

        public string? LogoUrl { get; set; }
        public string? FooterNote { get; set; }
    }
}
