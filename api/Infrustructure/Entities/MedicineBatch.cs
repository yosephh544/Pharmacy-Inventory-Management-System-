// ...existing code...
using System;
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
        public decimal SellingPrice { get; set; }

        public DateTime ReceivedDate { get; set; }

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        public bool IsActive { get; set; }
    }
}
// ...existing code...