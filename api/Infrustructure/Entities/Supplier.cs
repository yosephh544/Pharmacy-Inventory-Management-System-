using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Supplier : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? Address { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }

        public ICollection<MedicineBatch> Batches { get; set; } = new List<MedicineBatch>();
    }
}
