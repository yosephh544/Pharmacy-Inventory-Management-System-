using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class MedicineBatch : BaseEntity
    {
        public int MedicineId { get; set; }
        public Medicine Medicine { get; set; } = null!;

        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }

        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
    }
}
