using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.DTOs.Notifications;

namespace IntegratedImplementation.Services
{
    public class NotificationService : INotificationService
    {
        private readonly PharmacyDbContext _context;

        public NotificationService(PharmacyDbContext context)
        {
            _context = context;
        }

        public async Task<NotificationSummaryDto> GetNotificationsAsync(int userId, CancellationToken cancellationToken = default)
        {
            var notifications = new List<NotificationDto>();

            // Get low stock medicines
            var lowStockMedicines = await _context.Medicines
                .Include(m => m.Category)
                .Include(m => m.Batches)
                .Where(m => m.IsActive
                    && m.ReorderLevel > 0
                    && m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity) <= m.ReorderLevel)
                .ToListAsync(cancellationToken);

            foreach (var medicine in lowStockMedicines)
            {
                var totalStock = medicine.Batches.Where(b => b.IsActive).Sum(b => b.Quantity);
                notifications.Add(new NotificationDto
                {
                    Id = -medicine.Id, // Negative ID to indicate it's a dynamic notification
                    Title = "Low Stock Alert",
                    Message = $"{medicine.Name} ({medicine.Code}) is running low. Current stock: {totalStock}, Reorder level: {medicine.ReorderLevel}",
                    Type = "low-stock",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    LinkUrl = $"/medicines"
                });
            }

            // Get near expiry batches (within 30 days)
            var thresholdDate = DateTime.UtcNow.Date.AddDays(30);
            var today = DateTime.UtcNow.Date;

            var nearExpiryBatches = await _context.MedicineBatches
                .Include(b => b.Medicine)
                .Where(b => b.IsActive
                    && b.Quantity > 0
                    && b.ExpiryDate >= today
                    && b.ExpiryDate <= thresholdDate)
                .OrderBy(b => b.ExpiryDate)
                .Take(10) // Limit to top 10 most urgent
                .ToListAsync(cancellationToken);

            foreach (var batch in nearExpiryBatches)
            {
                var daysUntilExpiry = (batch.ExpiryDate.Date - today).Days;
                var urgency = daysUntilExpiry <= 7 ? "URGENT" : daysUntilExpiry <= 14 ? "Warning" : "Notice";
                notifications.Add(new NotificationDto
                {
                    Id = batch.Id + 100000, // Offset to avoid conflicts with medicine IDs
                    Title = $"{urgency}: Near Expiry",
                    Message = $"{batch.Medicine.Name} - Batch {batch.BatchNumber} expires in {daysUntilExpiry} day(s) on {batch.ExpiryDate:MMM dd, yyyy}",
                    Type = "near-expiry",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    LinkUrl = $"/reports/expiry"
                });
            }

            // Get expired batches with remaining stock
            var expiredBatches = await _context.MedicineBatches
                .Include(b => b.Medicine)
                .Where(b => b.IsActive
                    && b.Quantity > 0
                    && b.ExpiryDate < today)
                .OrderByDescending(b => b.ExpiryDate)
                .Take(5) // Limit to top 5 most recent
                .ToListAsync(cancellationToken);

            foreach (var batch in expiredBatches)
            {
                var daysExpired = (today - batch.ExpiryDate.Date).Days;
                notifications.Add(new NotificationDto
                {
                    Id = batch.Id + 200000, // Offset to avoid conflicts
                    Title = "Expired Stock Alert",
                    Message = $"{batch.Medicine.Name} - Batch {batch.BatchNumber} expired {daysExpired} day(s) ago. Quantity: {batch.Quantity}",
                    Type = "expired",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    LinkUrl = $"/reports/expiry"
                });
            }

            // Sort by urgency: expired first, then near-expiry (urgent), then low stock
            notifications = notifications.OrderByDescending(n => n.Type == "expired")
                .ThenByDescending(n => n.Type == "near-expiry" && n.Title.Contains("URGENT"))
                .ThenBy(n => n.CreatedAt)
                .ToList();

            // Check stored notifications from DB (if any exist)
            var storedNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync(cancellationToken);

            foreach (var stored in storedNotifications)
            {
                notifications.Add(new NotificationDto
                {
                    Id = stored.Id,
                    Title = stored.Title,
                    Message = stored.Message,
                    Type = "system", // Default type for stored notifications
                    IsRead = stored.IsRead,
                    CreatedAt = stored.CreatedAt
                });
            }

            return new NotificationSummaryDto
            {
                UnreadCount = notifications.Count(n => !n.IsRead),
                Notifications = notifications.Take(50).ToList() // Limit to 50 most recent
            };
        }

        public async Task MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
        {
            // Only mark stored notifications as read (dynamic ones can't be marked)
            if (notificationId > 0)
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

                if (notification != null)
                {
                    notification.IsRead = true;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
            // Dynamic notifications (negative or high IDs) are not stored, so nothing to mark
        }

        public async Task DeleteNotificationAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
        {
            // Only delete stored notifications
            if (notificationId > 0 && notificationId < 100000)
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

                if (notification != null)
                {
                    _context.Notifications.Remove(notification);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
            // Dynamic notifications can't be deleted
        }
    }
}
