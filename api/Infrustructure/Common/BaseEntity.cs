namespace Infrustructure.Common
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        /// <summary>Soft-delete flag. When true, the record is treated as deleted but kept in the database.</summary>
        public bool IsDeleted { get; set; }
    }
}
