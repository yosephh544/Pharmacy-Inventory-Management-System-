using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class StockAdjustment : BaseEntity
    {
        public int MedicineBatchId { get; set; }
        public MedicineBatch MedicineBatch { get; set; } = null!;

        public int QuantityChange { get; set; } // + or -

        public string Reason { get; set; } = null!;
    }
}
