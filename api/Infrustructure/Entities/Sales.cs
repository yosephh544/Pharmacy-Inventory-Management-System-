using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Sales")]

    public class Sales
    {
        [Key]
        public int Id { get; set; }
       public  string InvoiceNo { get; set; }
         public DateTime SoldDate { get; set; }
         public int TotalAmount { get; set; }
         public int PaymentMethod { get; set; }
        public int CreatedById { get; set; }
        
    }
    
    
    
}
