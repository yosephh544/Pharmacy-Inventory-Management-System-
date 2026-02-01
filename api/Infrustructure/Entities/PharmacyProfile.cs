
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("PharmacyProfiles")]

    public class PharmacyProfiles
    {
        [Key]
        public int Id { get; set; }
       public  int PharmacyCode { get; set; }
         public string Name { get; set; }
         public string LogoUrl { get; set; }
         public string phone { get; set; }
         public string Address { get; set; }
         public string Email { get; set; }

         public string InvoiceHeader { get; set; }
         public string InvoiceFooter { get; set; }
         public int LowStockThreshold { get; set; }
         public int ExpiryAlertDays { get; set; }

         public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        
    }
    
    
    
}
