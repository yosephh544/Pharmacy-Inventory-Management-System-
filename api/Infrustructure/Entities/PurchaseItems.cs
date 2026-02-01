using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("PurchaseItems")]

    public class PurchaseItems
    {
        [Key]
        public int Id { get; set; }
       public  string Phone { get; set; }
         public string Name { get; set; }
         public string Email { get; set; }
         public int LicenseNo { get; set; }
      
        
    }
    
    
    
}
