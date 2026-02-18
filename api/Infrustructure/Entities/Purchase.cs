using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Purchase : BaseEntity
    {
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public string? InvoiceNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal TotalAmount { get; set; }

        public User? CreatedByUser { get; set; }

        public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
    }
}
