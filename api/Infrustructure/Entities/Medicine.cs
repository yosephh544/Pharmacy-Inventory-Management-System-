using Infrustructure.Common;
using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Entities
{
    public class Medicine : BaseEntity
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = null!;

        public string? Code { get; set; }

        public decimal UnitPrice { get; set; }

        public int CategoryId { get; set; }
        public MedicineCategory Category { get; set; } = null!;

        public ICollection<MedicineBatch> Batches { get; set; } = new List<MedicineBatch>();
    }
}
