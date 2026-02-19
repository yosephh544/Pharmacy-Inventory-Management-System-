using System;

namespace IntegratedImplementation.DTOs.Batches
{
    public class BatchListItemDto
    {
        public int Id { get; set; }
        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public bool IsActive { get; set; }
    }

    public class BatchResponseDto
    {
        public int Id { get; set; }
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public DateTime ReceivedDate { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateBatchRequestDto
    {
        public int MedicineId { get; set; }
        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int SupplierId { get; set; }
        public DateTime? ReceivedDate { get; set; }
    }

    public class UpdateBatchRequestDto
    {
        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? Quantity { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? SellingPrice { get; set; }
        public int? SupplierId { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AdjustStockRequestDto
    {
        public int NewQuantity { get; set; }
        public string Reason { get; set; } = null!;
    }
}
