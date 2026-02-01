using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Sale : BaseEntity
    {
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }

        public int SoldByUserId { get; set; }
        public User SoldByUser { get; set; } = null!;

        public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    }
}
