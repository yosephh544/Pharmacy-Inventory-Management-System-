using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("MedicineBatches")]

    public class MedicineBatches
    {
        [Key]
        public int Id { get; set; }
       public  int MedId { get; set; }
         public string BatchNo { get; set; }
         public DateTime ExpiryDate { get; set; }
         public float PurchasePrice { get; set; }
         public float SellingPrice { get; set; }
         public int Quantity { get; set; }
         public DateTime RecievedDate { get; set; }
         public int SupplierId { get; set; }
        public bool IsActive { get; set; }
        
    }
    
    
    
}
