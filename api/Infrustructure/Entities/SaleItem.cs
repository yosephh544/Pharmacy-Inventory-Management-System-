using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class SaleItem : BaseEntity
    {
        public int SaleId { get; set; }
        public Sale Sale { get; set; } = null!;

        public int MedicineBatchId { get; set; }
        public MedicineBatch MedicineBatch { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
