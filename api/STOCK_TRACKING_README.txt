================================================================================
                    STOCK TRACKING & LOW STOCK NOTIFICATION SYSTEM
================================================================================

This document explains how the Pharmacy Inventory Management System tracks 
stock levels, detects low stock, and generates notifications.

================================================================================
1. DATA MODEL
================================================================================

There are two key entities:

MEDICINE (api/Infrustructure/Entities/Medicine.cs)
--------------------------------------------------------------------------------
- Id              : Primary key
- Name            : Medicine name (e.g., "Paracetamol 500mg")
- Code            : Unique code (e.g., "MED001")
- ReorderLevel    : Minimum acceptable stock level (INTEGER)
- IsActive        : Whether the medicine is active in the system
- Batches         : Collection of MedicineBatch records

MEDICINE BATCH (api/Infrustructure/Entities/MedicineBatch.cs)
--------------------------------------------------------------------------------
- Id              : Primary key
- MedicineId      : Foreign key to Medicine
- BatchNumber     : Unique batch identifier (e.g., "BN20260101")
- Quantity        : Current quantity in this batch (INTEGER)
- ExpiryDate      : When this batch expires
- PurchasePrice   : Cost price per unit
- SellingPrice    : Sale price per unit
- IsActive        : Whether batch is active
- SupplierId      : Foreign key to Supplier

================================================================================
2. HOW STOCK IS TRACKED
================================================================================

STOCK IS STORED PER BATCH, NOT PER MEDICINE
--------------------------------------------------------------------------------
- Each Medicine can have multiple batches (same medicine from different 
  suppliers, different expiry dates, different purchase dates).
- The "Quantity" field on MedicineBatch is the actual stock count.
- A Medicine does NOT have a single "stock" field. Instead, total stock is 
  calculated by summing the Quantity of all active batches.

FORMULA FOR TOTAL STOCK:
--------------------------------------------------------------------------------
    TotalStock = SUM(batch.Quantity) for all batches WHERE:
                 - batch.MedicineId = medicine.Id
                 - batch.IsActive = true

    (Note: Sometimes only non-expired batches are counted for available stock)

================================================================================
3. HOW LOW STOCK IS DETECTED
================================================================================

LOW STOCK CONDITION:
--------------------------------------------------------------------------------
A medicine is considered "low stock" when:

    TotalActiveStock <= ReorderLevel  AND  ReorderLevel > 0

Where:
    TotalActiveStock = SUM of Quantity from all ACTIVE batches for that medicine

IMPLEMENTATION (NotificationService.cs lines 27-71):
--------------------------------------------------------------------------------
1. Load all medicines where IsActive=true AND ReorderLevel > 0
2. Include their batches
3. For each medicine, calculate:
   - totalStock = medicine.Batches.Where(b => b.IsActive).Sum(b => b.Quantity)
4. Filter to medicines where totalStock <= medicine.ReorderLevel
5. Sort by totalStock ascending (most critical first)
6. Generate notifications for the top 5 most critical

CODE EXAMPLE:
--------------------------------------------------------------------------------
    var lowStockMedicines = medicinesWithBatches
        .Where(m => m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity) 
                    <= m.ReorderLevel)
        .OrderBy(m => m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity))
        .ToList();

================================================================================
4. HOW STOCK CHANGES
================================================================================

STOCK INCREASES WHEN:
--------------------------------------------------------------------------------
- A new batch is created (via purchase or manual addition)
- A sale is cancelled (restores quantities to batches)
- Manual stock adjustment (AdjustStockAsync)

STOCK DECREASES WHEN:
--------------------------------------------------------------------------------
- A sale is made (deducts from batches using FIFO)
- Manual stock adjustment
- Batch is deleted or deactivated

FIFO SALES LOGIC (SalesService.cs lines 42-67):
--------------------------------------------------------------------------------
When a sale is made, the system uses FIFO (First In, First Out) based on 
expiry date:

1. Find all active, non-expired batches for the medicine
2. Sort by ExpiryDate ascending (earliest expiry first)
3. Deduct from batches in order until the requested quantity is fulfilled
4. If total available < requested quantity, the sale is rejected

EXAMPLE:
--------------------------------------------------------------------------------
Medicine: Paracetamol 500mg
Requested: 100 units

Available batches (sorted by expiry):
- Batch A: 30 units, expires 2026-03-01
- Batch B: 50 units, expires 2026-04-15
- Batch C: 80 units, expires 2026-06-01

Deduction:
- Batch A: 30 taken (0 remaining)
- Batch B: 50 taken (0 remaining)
- Batch C: 20 taken (60 remaining)

Total deducted: 100 units

================================================================================
5. REORDER LEVEL CONFIGURATION
================================================================================

WHERE TO SET:
--------------------------------------------------------------------------------
- ReorderLevel is set on the MEDICINE entity, not on individual batches
- Set when creating or editing a medicine

WHAT VALUE TO USE:
--------------------------------------------------------------------------------
- ReorderLevel = 0 means "don't track low stock for this medicine"
- Set ReorderLevel based on:
  - Average daily/weekly sales
  - Lead time for restocking
  - Criticality of the medicine

EXAMPLE:
--------------------------------------------------------------------------------
If a medicine sells ~10 units/day and restocking takes 7 days:
    ReorderLevel = 10 * 7 = 70 units

This ensures you get an alert when stock falls to 7 days of supply.

================================================================================
6. NOTIFICATION SYSTEM
================================================================================

LOW STOCK NOTIFICATIONS (NotificationService.cs):
--------------------------------------------------------------------------------
- Generated dynamically (not stored in database)
- Triggered when GET /api/notifications is called
- Uses negative IDs (e.g., -medicineId) to identify dynamic notifications

NOTIFICATION TYPES:
--------------------------------------------------------------------------------
1. LOW STOCK SUMMARY (ID: -999999)
   - Appears when > 5 medicines are low
   - Message: "X medicines are running low on stock"
   - Links to: /reports/current-stock

2. INDIVIDUAL LOW STOCK (ID: -medicineId)
   - Top 5 most critical medicines
   - Message: "[Name] ([Code]) is running low. Current: X, Reorder: Y"
   - Links to: /medicines

3. NEAR EXPIRY - URGENT (within 7 days)
4. NEAR EXPIRY - WARNING (7-14 days)
5. EXPIRED STOCK

================================================================================
7. REPORTS
================================================================================

CURRENT STOCK REPORT (ReportsService.cs):
--------------------------------------------------------------------------------
Endpoint: GET /api/reports/current-stock

Returns for each medicine:
- MedicineName, MedicineCode, CategoryName
- TotalStock (sum of active batch quantities)
- ReorderLevel
- IsLowStock (true if TotalStock <= ReorderLevel AND ReorderLevel > 0)
- UnitPrice

CODE:
--------------------------------------------------------------------------------
    IsLowStock = m.Batches.Where(b => b.IsActive).Sum(b => b.Quantity) 
                 <= m.ReorderLevel && m.ReorderLevel > 0

================================================================================
8. HOW TO MODIFY THE SYSTEM
================================================================================

TO CHANGE LOW STOCK THRESHOLD LOGIC:
--------------------------------------------------------------------------------
File: api/IntegratedImplementation/Services/NotificationService.cs
Line: 35

Current: totalStock <= ReorderLevel
Change to: totalStock < ReorderLevel * 1.2  (for 20% buffer)

TO ADD EXPIRY BUFFER TO AVAILABLE STOCK:
--------------------------------------------------------------------------------
Currently, low stock counts ALL active batches.
To exclude batches expiring within X days:

    var totalStock = medicine.Batches
        .Where(b => b.IsActive && b.ExpiryDate > DateTime.UtcNow.AddDays(30))
        .Sum(b => b.Quantity);

TO CHANGE NUMBER OF NOTIFICATIONS SHOWN:
--------------------------------------------------------------------------------
File: NotificationService.cs
- Line 42: Change "5" to show more/fewer in summary threshold
- Line 57: Change "5" to show more individual low stock alerts

TO ADD EMAIL/SMS ALERTS:
--------------------------------------------------------------------------------
1. Create a scheduled job (e.g., Hangfire, Quartz.NET)
2. Call the notification service to get low stock medicines
3. Send alerts via your email/SMS provider

================================================================================
9. DATABASE QUERIES FOR TROUBLESHOOTING
================================================================================

List all low stock medicines (SQL):
--------------------------------------------------------------------------------
SELECT m.Id, m.Name, m.Code, m.ReorderLevel,
       SUM(CASE WHEN b.IsActive = 1 THEN b.Quantity ELSE 0 END) AS TotalStock
FROM Medicines m
LEFT JOIN MedicineBatches b ON b.MedicineId = m.Id
WHERE m.IsActive = 1 AND m.ReorderLevel > 0
GROUP BY m.Id, m.Name, m.Code, m.ReorderLevel
HAVING SUM(CASE WHEN b.IsActive = 1 THEN b.Quantity ELSE 0 END) <= m.ReorderLevel

List batches for a specific medicine:
--------------------------------------------------------------------------------
SELECT b.Id, b.BatchNumber, b.Quantity, b.ExpiryDate, b.IsActive
FROM MedicineBatches b
WHERE b.MedicineId = @medicineId
ORDER BY b.ExpiryDate

================================================================================
10. SUMMARY
================================================================================

+-------------+           +------------------+
|  MEDICINE   |1        * |  MEDICINE BATCH  |
|-------------|-----------|------------------|
| ReorderLevel|           | Quantity         |
| IsActive    |           | ExpiryDate       |
+-------------+           | IsActive         |
                          +------------------+

LOW STOCK = SUM(active batch quantities) <= ReorderLevel

Stock changes via:
- Sales (FIFO deduction)
- Purchases (new batches)
- Manual adjustments
- Sale cancellations (restore)

Notifications are generated dynamically on each API call, not stored.

================================================================================
