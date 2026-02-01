using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("UserRoles")]

    public class UserRoles
    {
        [Key]
        public int UserId { get; set; }
        public int RoleId { get; set; }
        
        
    }
    
    
    
}
