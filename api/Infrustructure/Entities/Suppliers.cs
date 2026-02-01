using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Suppliers")]

    public class Suppliers
    {
        [Key]
        public int Id { get; set; }
       public  int Phone { get; set; }
         public string Name { get; set; }
         public string Email { get; set; }
         public int LicenseNo { get; set; }
      
        
    }
    
    
    
}
