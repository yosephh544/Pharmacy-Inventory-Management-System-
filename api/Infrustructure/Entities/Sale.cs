using Infrustructure.Common;

namespace Infrustructure.Entities
{
    public class Sale : BaseEntity
    {
        public string? InvoiceNumber { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }

        public string? PaymentMethod { get; set; }

        /// <summary>When true, sale was cancelled and batch quantities were restored.</summary>
        public bool IsCancelled { get; set; }

        public int? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        public int SoldByUserId { get; set; }
        public User SoldByUser { get; set; } = null!;

        public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    }
}
