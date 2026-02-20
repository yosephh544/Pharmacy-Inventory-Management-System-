using IntegratedImplementation.DTOs.Notifications;

namespace IntegratedImplementation.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationSummaryDto> GetNotificationsAsync(int userId, CancellationToken cancellationToken = default);
        Task MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default);
        Task DeleteNotificationAsync(int notificationId, int userId, CancellationToken cancellationToken = default);
    }
}
