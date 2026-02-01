using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("MedicineCategories")]

    public class MedicineCategories
    {
        [Key]
        public int Id { get; set; }
        
        public string CategoryName { get; set; }
        
    }
    
    
    
}
