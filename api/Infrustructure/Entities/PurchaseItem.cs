using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class PurchaseItem : BaseEntity
    {
        public int PurchaseId { get; set; }
        public Purchase Purchase { get; set; } = null!;

        // keep batch link for inventory tracking
        public int? MedicineBatchId { get; set; }
        public MedicineBatch? MedicineBatch { get; set; }

        public int? MedicineId { get; set; }
        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; }

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? UnitCost { get; set; }
    }
}
