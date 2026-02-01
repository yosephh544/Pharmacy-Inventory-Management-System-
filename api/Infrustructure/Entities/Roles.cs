using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Roles")]

    public class Roles
    {
        [Key]
        public int Id { get; set; }
        
        public String RoleName{ get; set;}
    }
    
    
    
}
