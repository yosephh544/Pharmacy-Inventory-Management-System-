using Infrustructure.Common;
using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Entities
{
    public class MedicineCategory : BaseEntity
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        public ICollection<Medicine> Medicines { get; set; } = new List<Medicine>();
    }
}
