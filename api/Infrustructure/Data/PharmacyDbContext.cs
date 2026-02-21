using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Infrustructure.Common;

namespace Pharmacy.Infrastructure.Data
{
    public class PharmacyDbContext : DbContext
    {
        public PharmacyDbContext(DbContextOptions<PharmacyDbContext> options)
            : base(options)
        {
        }

        // 🔐 AUTH & PHARMACY
        public DbSet<PharmacyProfile> PharmacyProfiles => Set<PharmacyProfile>();
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

            // Ensure all BaseEntity-derived entities have IsDeleted configured consistently
            // so migrations produce the same schema on every machine (no drift).
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(nameof(BaseEntity.IsDeleted))
                        .IsRequired()
                        .HasDefaultValue(false);
                }
            }

            // Composite keys
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(x => new { x.UserId, x.RoleId });
                entity.ToTable(tb => tb.UseSqlOutputClause(false));
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable(tb => tb.UseSqlOutputClause(false));
            });

            // User ↔ Role
            modelBuilder.Entity<UserRole>()
                .HasOne(x => x.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(x => x.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(x => x.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(x => x.RoleId);

            // PharmacyProfile: explicit table name so it matches InitialCreate and all clones
            modelBuilder.Entity<PharmacyProfile>()
                .ToTable("PharmacyProfile");

            // User -> PharmacyProfile
            modelBuilder.Entity<User>()
                .HasOne(x => x.PharmacyProfile)
                .WithMany()
                .HasForeignKey(x => x.PharmacyProfileId);

            // Medicine
            modelBuilder.Entity<Medicine>()
                .HasIndex(x => x.Code)
                .IsUnique();

            modelBuilder.Entity<Medicine>()
                .HasOne(x => x.Category)
                .WithMany(c => c.Medicines)
                .HasForeignKey(x => x.CategoryId);

            // MedicineBatch
            modelBuilder.Entity<MedicineBatch>()
                .HasOne(x => x.Medicine)
                .WithMany(m => m.Batches)
                .HasForeignKey(x => x.MedicineId);

            modelBuilder.Entity<MedicineBatch>()
                .HasOne(x => x.Supplier)
                .WithMany(s => s.Batches)
                .HasForeignKey(x => x.SupplierId);

            // Purchase
            modelBuilder.Entity<Purchase>()
                .HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierId);

            modelBuilder.Entity<Purchase>()
                .HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey("CreatedByUserId");

            modelBuilder.Entity<Purchase>()
                .HasMany(x => x.Items)
                .WithOne(x => x.Purchase)
                .HasForeignKey(x => x.PurchaseId);

            // Sale
            modelBuilder.Entity<Sale>()
                .HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId);

            modelBuilder.Entity<Sale>()
                .HasOne(x => x.SoldByUser)
                .WithMany()
                .HasForeignKey(x => x.SoldByUserId);

            modelBuilder.Entity<Sale>()
                .HasMany(x => x.Items)
                .WithOne(x => x.Sale)
                .HasForeignKey(x => x.SaleId);

            modelBuilder.Entity<SaleItem>()
                .HasOne(x => x.MedicineBatch)
                .WithMany()
                .HasForeignKey(x => x.MedicineBatchId);

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

            // Additional decimal precision mappings to avoid truncation warnings
            modelBuilder.Entity<Medicine>()
                .Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Purchase>()
                .Property(x => x.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseItem>()
                .Property(x => x.UnitCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Sale>()
                .Property(x => x.TotalAmount)
                .HasPrecision(18, 2);
        }
    }
}
