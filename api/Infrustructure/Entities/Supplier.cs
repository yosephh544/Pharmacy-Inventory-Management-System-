using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Supplier : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? Address { get; set; }
    }
}
