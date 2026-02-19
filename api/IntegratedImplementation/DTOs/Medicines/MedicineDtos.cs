using System;

namespace IntegratedImplementation.DTOs.Medicines
{
    public class MedicineListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Code { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? CategoryName { get; set; }
        public int TotalStock { get; set; }
        public bool IsActive { get; set; }
    }

    public class MedicineResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Code { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? Strength { get; set; }
        public string? Manufacturer { get; set; }
        public int ReorderLevel { get; set; }
        public bool RequiresPrescription { get; set; }
        public bool IsActive { get; set; }
        public decimal? UnitPrice { get; set; }
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int TotalStock { get; set; }
    }

    public class CreateMedicineRequestDto
    {
        public string Name { get; set; } = null!;
        public string Code { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? Strength { get; set; }
        public string? Manufacturer { get; set; }
        public int ReorderLevel { get; set; }
        public bool RequiresPrescription { get; set; }
        public int CategoryId { get; set; }
        public decimal? UnitPrice { get; set; }
    }

    public class UpdateMedicineRequestDto
    {
        public string? Name { get; set; }
        public string? GenericName { get; set; }
        public string? Strength { get; set; }
        public string? Manufacturer { get; set; }
        public int? ReorderLevel { get; set; }
        public bool? RequiresPrescription { get; set; }
        public int? CategoryId { get; set; }
        public decimal? UnitPrice { get; set; }
        public bool? IsActive { get; set; }
    }
}
