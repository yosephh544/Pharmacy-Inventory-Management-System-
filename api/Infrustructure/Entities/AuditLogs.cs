using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegratedInfrustructure.Models
{
    [Table("AuditLogs")]

    public class AuditLogs
    {
        [Key]
        public int Id { get; set; }
       public  int UserID { get; set; }
         public string Action { get; set; }
         public int Entity { get; set; }
         public int EntityId { get; set; }
        public int UnitPrice { get; set; }

        public DateTime ActionDate { get; set;}
        
    }
    
    
    
}
