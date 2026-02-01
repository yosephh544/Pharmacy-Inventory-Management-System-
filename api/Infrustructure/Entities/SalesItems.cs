using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("SalesItems")]

    public class SalesItems
    {
        [Key]
        public int Id { get; set; }
       public  int SaleId { get; set; }
         public string MedId { get; set; }
         public int BatchId { get; set; }
         public int Quantity { get; set; }
        public int UnitPrice { get; set; }
        
    }
    
    
    
}
