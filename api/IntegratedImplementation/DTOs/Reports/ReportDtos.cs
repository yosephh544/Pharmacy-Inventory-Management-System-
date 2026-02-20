namespace IntegratedImplementation.DTOs.Reports
{
    // Current Stock Report
    public class CurrentStockReportDto
    {
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string MedicineCode { get; set; } = null!;
        public string? CategoryName { get; set; }
        public int TotalStock { get; set; }
        public int ReorderLevel { get; set; }
        public bool IsLowStock { get; set; }
        public decimal? UnitPrice { get; set; }
    }

    // Near Expiry Report
    public class NearExpiryReportDto
    {
        public int BatchId { get; set; }
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string MedicineCode { get; set; } = null!;
        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int DaysUntilExpiry { get; set; }
        public int RemainingQuantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
    }

    // Expired Report
    public class ExpiredReportDto
    {
        public int BatchId { get; set; }
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string MedicineCode { get; set; } = null!;
        public string BatchNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int DaysExpired { get; set; }
        public int RemainingQuantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal FinancialLoss { get; set; } // RemainingQuantity × PurchasePrice
    }

    // Daily Sales Report
    public class DailySalesReportDto
    {
        public DateTime Date { get; set; }
        public int TransactionCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    // Monthly Sales Report
    public class MonthlySalesReportDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = null!;
        public int TransactionCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    // Purchase History Report
    public class PurchaseHistoryReportDto
    {
        public int PurchaseId { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = null!;
        public int ItemId { get; set; }
        public int? MedicineId { get; set; }
        public string? MedicineName { get; set; }
        public string? MedicineCode { get; set; }
        public string? BatchNumber { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? UnitCost { get; set; }
        public decimal LineTotal { get; set; }
        public decimal PurchaseTotalAmount { get; set; }
    }

    // Export Report Request
    public class ExportReportRequestDto
    {
        public string ReportType { get; set; } = null!; // "current-stock", "near-expiry", "expired", "sales-daily", "sales-monthly", "purchase-history"
        public string Format { get; set; } = "csv"; // "csv", "excel", "pdf"
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? SupplierId { get; set; }
        public int? MedicineId { get; set; }
    }
}
