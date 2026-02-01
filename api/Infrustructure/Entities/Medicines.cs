
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Medicines")]

    public class Medicines
    {
        [Key]
        public int Id { get; set; }
       public  int Code { get; set; }
         public string Name { get; set; }
         public string GenericName { get; set; }
         public int CategoryId { get; set; }
         public string Strength { get; set; }
         public string Manufacturer { get; set; }
         public int RecordLevel { get; set; }
         public bool RequiresPrescription { get; set; }
        public bool IsActive { get; set; }
        
    }
    
    
    
}
