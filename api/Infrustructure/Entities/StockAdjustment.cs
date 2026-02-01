using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("StockAdjustments")]

    public class StockAdjustmentss
    {
        [Key]
        public int Id { get; set; }
       public  int MedBatchId { get; set; }
         public string QuantityChanged { get; set; }
         public int Reason { get; set; }
         public int AdjustmentType { get; set; }
        public int CreatedById { get; set; }
        public DateTime CreatedDate { get; set; }
    }
    
    
    
}
