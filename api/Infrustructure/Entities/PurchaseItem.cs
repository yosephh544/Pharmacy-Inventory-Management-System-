using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class PurchaseItem : BaseEntity
    {
        public int PurchaseId { get; set; }
        public Purchase Purchase { get; set; } = null!;

        public int MedicineBatchId { get; set; }
        public MedicineBatch MedicineBatch { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
    }
}
