using Infrustructure.Common;
using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Entities
{
    public class Medicine : BaseEntity
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = null!;

        [Required, MaxLength(50)]
        public string Code { get; set; } = null!;

        [MaxLength(150)]
        public string? GenericName { get; set; }

        [MaxLength(50)]
        public string? Strength { get; set; }

        [MaxLength(150)]
        public string? Manufacturer { get; set; }

        public int ReorderLevel { get; set; }
        public bool RequiresPrescription { get; set; }
        public bool IsActive { get; set; } = true;

        public decimal? UnitPrice { get; set; }

        public int CategoryId { get; set; }
        public MedicineCategory Category { get; set; } = null!;

        public ICollection<MedicineBatch> Batches { get; set; } = new List<MedicineBatch>();
    }
}
