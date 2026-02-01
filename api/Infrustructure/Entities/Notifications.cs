using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("Notifications")]

    public class Notifications
    {
        [Key]
        public int Id { get; set; }
       public  string Title { get; set; }
         public string Message { get; set; }
         public bool IsRead { get; set; }
         public DateTime CreatedAt { get; set; }
        
    }
    
    
    
}
