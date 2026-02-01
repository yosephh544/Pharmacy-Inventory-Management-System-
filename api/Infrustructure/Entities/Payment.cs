using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Payment : BaseEntity
    {
        public decimal Amount { get; set; }
        public string Method { get; set; } = null!; // Cash, Card, Mobile
        public DateTime PaidAt { get; set; }

        public int SaleId { get; set; }
        public Sale Sale { get; set; } = null!;
    }
}
