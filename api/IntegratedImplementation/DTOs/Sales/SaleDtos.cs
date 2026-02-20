namespace IntegratedImplementation.DTOs.Sales
{
    /// <summary>Request to create a new sale. Line items are by medicine; service will resolve batches (FIFO).</summary>
    public class CreateSaleRequestDto
    {
        public List<CreateSaleItemDto> Items { get; set; } = new();
        public string? PaymentMethod { get; set; }
    }

    public class CreateSaleItemDto
    {
        public int MedicineId { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>Single sale for list/detail responses.</summary>
    public class SaleResponseDto
    {
        public int Id { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? PaymentMethod { get; set; }
        public bool IsCancelled { get; set; }
        public int? CreatedByUserId { get; set; }
        public int SoldByUserId { get; set; }
        public string? SoldByUserName { get; set; }
        public List<SaleItemResponseDto> Items { get; set; } = new();
    }

    public class SaleItemResponseDto
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public int MedicineBatchId { get; set; }
        public string? MedicineName { get; set; }
        public string? MedicineCode { get; set; }
        public string? BatchNumber { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal => Quantity * UnitPrice;
    }
}
