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

            // Get all active medicines with batches, then filter low stock in memory (EF has trouble with Sum in Where)
            var medicinesWithBatches = await _context.Medicines
                .Include(m => m.Category)
                .Include(m => m.Batches)
                .Where(m => m.IsActive && m.ReorderLevel > 0)
                .ToListAsync(cancellationToken);

            var lowStockMedicines = medicinesWithBatches
                .Where(m => m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity) <= m.ReorderLevel)
                .OrderBy(m => m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity))
                .ToList();

            if (lowStockMedicines.Count > 0)
            {
                // Add summary notification if more than 5 items
                if (lowStockMedicines.Count > 5)
                {
                    notifications.Add(new NotificationDto
                    {
                        Id = -999999, // Special ID for summary
                        Title = "Low Stock Alert - Summary",
                        Message = $"{lowStockMedicines.Count} medicines are running low on stock. Click to view details.",
                        Type = "low-stock",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        LinkUrl = "/reports/current-stock"
                    });
                }

                // Add individual notifications for top 5 most critical (lowest stock)
                foreach (var medicine in lowStockMedicines.Take(5))
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
                        LinkUrl = "/medicines"
                    });
                }
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
                .ToListAsync(cancellationToken);

            if (nearExpiryBatches.Count > 0)
            {
                // Group by urgency
                var urgentBatches = nearExpiryBatches.Where(b => (b.ExpiryDate.Date - today).Days <= 7).ToList();
                var warningBatches = nearExpiryBatches.Where(b => (b.ExpiryDate.Date - today).Days > 7 && (b.ExpiryDate.Date - today).Days <= 14).ToList();

                // Add summary for urgent batches
                if (urgentBatches.Count > 0)
                {
                    notifications.Add(new NotificationDto
                    {
                        Id = -888888, // Special ID for urgent summary
                        Title = "URGENT: Near Expiry",
                        Message = $"{urgentBatches.Count} batch(es) expiring within 7 days! Immediate action required.",
                        Type = "near-expiry",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        LinkUrl = "/reports/expiry"
                    });
                }

                // Add individual notifications for urgent batches (up to 5)
                foreach (var batch in urgentBatches.Take(5))
                {
                    var daysUntilExpiry = (batch.ExpiryDate.Date - today).Days;
                    notifications.Add(new NotificationDto
                    {
                        Id = batch.Id + 100000, // Offset to avoid conflicts with medicine IDs
                        Title = "URGENT: Near Expiry",
                        Message = $"{batch.Medicine.Name} - Batch {batch.BatchNumber} expires in {daysUntilExpiry} day(s) on {batch.ExpiryDate:MMM dd, yyyy}",
                        Type = "near-expiry",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        LinkUrl = "/reports/expiry"
                    });
                }

                // Add individual notifications for warning batches (up to 5)
                foreach (var batch in warningBatches.Take(5))
                {
                    var daysUntilExpiry = (batch.ExpiryDate.Date - today).Days;
                    notifications.Add(new NotificationDto
                    {
                        Id = batch.Id + 100000,
                        Title = "Warning: Near Expiry",
                        Message = $"{batch.Medicine.Name} - Batch {batch.BatchNumber} expires in {daysUntilExpiry} day(s) on {batch.ExpiryDate:MMM dd, yyyy}",
                        Type = "near-expiry",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        LinkUrl = "/reports/expiry"
                    });
                }
            }

            // Get expired batches with remaining stock
            var expiredBatches = await _context.MedicineBatches
                .Include(b => b.Medicine)
                .Where(b => b.IsActive
                    && b.Quantity > 0
                    && b.ExpiryDate < today)
                .OrderByDescending(b => b.ExpiryDate)
                .ToListAsync(cancellationToken);

            if (expiredBatches.Count > 0)
            {
                var totalExpiredValue = expiredBatches.Sum(b => b.Quantity * b.PurchasePrice);
                
                // Add summary notification
                notifications.Add(new NotificationDto
                {
                    Id = -777777, // Special ID for expired summary
                    Title = "Expired Stock Alert",
                    Message = $"{expiredBatches.Count} expired batch(es) with remaining stock. Total financial loss: {totalExpiredValue:F2} ETB",
                    Type = "expired",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    LinkUrl = "/reports/expiry"
                });

                // Add individual notifications for most recent expired batches (up to 5)
                foreach (var batch in expiredBatches.Take(5))
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
                        LinkUrl = "/reports/expiry"
                    });
                }
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
