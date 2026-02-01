using Microsoft.EntityFrameworkCore;
using Pharmacy.Domain.Entities;

namespace Pharmacy.Infrastructure.Data
{
    public class PharmacyDbContext : DbContext
    {
        public PharmacyDbContext(DbContextOptions<PharmacyDbContext> options)
            : base(options)
        {
        }

        // 🔐 AUTH
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();

        // 💊 MEDICINE & INVENTORY
        public DbSet<Medicine> Medicines => Set<Medicine>();
        public DbSet<MedicineCategory> MedicineCategories => Set<MedicineCategory>();
        public DbSet<MedicineBatch> MedicineBatches => Set<MedicineBatch>();

        // 🚚 SUPPLIERS & PURCHASES
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<Purchase> Purchases => Set<Purchase>();
        public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();

        // 🧾 SALES
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();

        // ⚠️ STOCK / AUDIT / NOTIFICATIONS
        public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply global soft delete filter
            ApplySoftDeleteFilter(modelBuilder);

            // Composite keys
            modelBuilder.Entity<UserRole>()
                .HasKey(x => new { x.UserId, x.RoleId });

            // User ↔ Role
            modelBuilder.Entity<UserRole>()
                .HasOne(x => x.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(x => x.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(x => x.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(x => x.RoleId);

            // Medicine
            modelBuilder.Entity<Medicine>()
                .HasIndex(x => x.Code)
                .IsUnique();

            modelBuilder.Entity<Medicine>()
                .HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId);

            // MedicineBatch
            modelBuilder.Entity<MedicineBatch>()
                .HasOne(x => x.Medicine)
                .WithMany(m => m.Batches)
                .HasForeignKey(x => x.MedicineId);

            modelBuilder.Entity<MedicineBatch>()
                .HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierId);

            // Purchase
            modelBuilder.Entity<Purchase>()
                .HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierId);

            modelBuilder.Entity<Purchase>()
                .HasMany(x => x.Items)
                .WithOne(x => x.Purchase)
                .HasForeignKey(x => x.PurchaseId);

            // Sale
            modelBuilder.Entity<Sale>()
                .HasMany(x => x.Items)
                .WithOne(x => x.Sale)
                .HasForeignKey(x => x.SaleId);

            modelBuilder.Entity<SaleItem>()
                .HasOne(x => x.Batch)
                .WithMany()
                .HasForeignKey(x => x.BatchId);

            // Decimal precision
            modelBuilder.Entity<MedicineBatch>()
                .Property(x => x.PurchasePrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<MedicineBatch>()
                .Property(x => x.SellingPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SaleItem>()
                .Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseItem>()
                .Property(x => x.UnitPrice)
                .HasPrecision(18, 2);
        }

        private static void ApplySoftDeleteFilter(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(Pharmacy.Domain.Common.BaseEntity)
                    .IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .HasQueryFilter(
                            EF.Property<bool>(EF.Property<object>(null!, "Entity"), "IsDeleted") == false
                        );
                }
            }
        }
    }
}
