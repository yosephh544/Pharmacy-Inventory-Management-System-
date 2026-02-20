namespace IntegratedImplementation.DTOs.Notifications
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!; // "low-stock", "near-expiry", "expired"
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? LinkUrl { get; set; } // Optional link to relevant page
    }

    public class NotificationSummaryDto
    {
        public int UnreadCount { get; set; }
        public List<NotificationDto> Notifications { get; set; } = new();
    }
}
