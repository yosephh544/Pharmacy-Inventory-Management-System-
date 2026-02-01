using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Purchases")]

    public class Purchases
    {
        [Key]
        public int Id { get; set; }
       public  int SupplierId { get; set; }
         public string InvoiceNo { get; set; }
         public DateTime PurchaseDate { get; set; }
         public int TotalAmount { get; set; }
      
        
    }
    
    
    
}
