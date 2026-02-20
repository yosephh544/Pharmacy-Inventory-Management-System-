PHARMACY INVENTORY SYSTEM - MEDICINES, BATCHES, CATEGORIES & SALES
====================================================================

This document explains how **Medicine Categories**, **Medicines**, **Medicine Batches**, and **Sales**
work together in this system, and how user roles control access to each feature.

The code lives mainly in:
- Medicine Categories:  `api/IntegratedApi/Controllers/MedicineCategoriesController.cs`
                        `api/IntegratedImplementation/Services/MedicineCategoryService.cs`
                        `api/Infrustructure/Entities/MedicineCategory.cs`
- Medicines:            `api/IntegratedApi/Controllers/MedicinesController.cs`
                        `api/IntegratedImplementation/Services/MedicineService.cs`
                        `api/Infrustructure/Entities/Medicine.cs`
- Medicine Batches:     `api/IntegratedApi/Controllers/BatchesController.cs`
                        `api/IntegratedImplementation/Services/MedicineBatchService.cs`
                        `api/Infrustructure/Entities/MedicineBatch.cs`
- Sales:               `api/IntegratedApi/Controllers/SalesController.cs`
                        `api/IntegratedImplementation/Services/SalesService.cs`
                        `api/Infrustructure/Entities/Sale.cs`
                        `api/Infrustructure/Entities/SaleItem.cs`

═══════════════════════════════════════════════════════════════════════════════
1. MEDICINE CATEGORIES
═══════════════════════════════════════════════════════════════════════════════

WHAT IT IS:
-----------
A **Medicine Category** is a classification group for medicines (e.g., "Antibiotics", "Analgesics", "Vitamins").
Categories help organize medicines and enable filtering/reporting.

ENTITY STRUCTURE:
-----------------
- `Id` (int): Primary key
- `Name` (string, max 100 chars): Category name (e.g., "Antibiotics")
- `CreatedAt` (DateTime): When the category was created
- `Medicines` (collection): All medicines belonging to this category

API ENDPOINTS:
--------------
- GET    /api/medicine-categories/GetAllCategories
  → Returns all categories (any authenticated user)
  
- GET    /api/medicine-categories/GetCategoryById/{id}
  → Returns a single category by ID (any authenticated user)
  
- POST   /api/medicine-categories/CreateCategory
  → Creates a new category
  → Requires roles: Admin, Storekeeper, Pharmacist
  
- DELETE /api/medicine-categories/DeleteCategory/{id}
  → Deletes a category
  → Requires role: Admin
  → ⚠️ Cannot delete if medicines are assigned to this category

BUSINESS RULES:
---------------
✅ Category name must be unique (enforced by service logic)
✅ Cannot delete a category that has medicines assigned to it
✅ All operations are logged to AuditLog

HOW IT RELATES TO MEDICINES:
-----------------------------
- Each Medicine MUST belong to exactly one Category (via `Medicine.CategoryId`)
- When creating a Medicine, you must provide a valid `CategoryId`
- Medicine list views show the category name alongside each medicine
- Categories enable filtering medicines by type

═══════════════════════════════════════════════════════════════════════════════
2. MEDICINES
═══════════════════════════════════════════════════════════════════════════════

WHAT IT IS:
-----------
A **Medicine** is a product definition (master data) that describes a medicine's
properties. It does NOT hold stock directly—stock is managed via Batches.

ENTITY STRUCTURE:
-----------------
- `Id` (int): Primary key
- `Name` (string, max 150): Medicine name (e.g., "Paracetamol 500mg")
- `Code` (string, max 50, unique): Unique medicine code (e.g., "MED001")
- `GenericName` (string, optional): Generic name
- `Strength` (string, optional): e.g., "500mg"
- `Manufacturer` (string, optional): Manufacturer name
- `ReorderLevel` (int): Minimum stock level before reorder alert
- `RequiresPrescription` (bool): Whether prescription is required
- `IsActive` (bool): Soft delete flag (false = disabled)
- `UnitPrice` (decimal, optional): Default selling price
- `CategoryId` (int, FK): Must reference an existing MedicineCategory
- `Category` (navigation): The category this medicine belongs to
- `Batches` (collection): All batches of this medicine

IMPORTANT CONCEPT:
------------------
**Medicine does NOT store stock quantity directly.**
Stock is stored in MedicineBatch entities. The total stock for a medicine is
calculated by summing all active batches: `TotalStock = Batches.Sum(b => b.Quantity)`

API ENDPOINTS:
--------------
- GET    /api/medicines/GetMedicines
  → Returns all medicines with calculated TotalStock
  → Includes: Id, Name, Code, CategoryName, TotalStock, ReorderLevel, UnitPrice, IsActive
  → Any authenticated user can view
  
- GET    /api/medicines/GetMedicineById/{id}
  → Returns full medicine details including all batches
  → Any authenticated user can view
  
- POST   /api/medicines/CreateMedicine
  → Creates a new medicine
  → Requires roles: Admin, Storekeeper, Pharmacist
  → Must provide valid CategoryId
  → Code must be unique
  
- PUT    /api/medicines/UpdateMedicine/{id}
  → Updates medicine properties
  → Requires roles: Admin, Storekeeper, Pharmacist
  → Can update: Name, GenericName, Strength, Manufacturer, ReorderLevel,
                RequiresPrescription, CategoryId, UnitPrice, IsActive
  
- DELETE /api/medicines/DeleteMedicine/{id}
  → Soft deletes (sets IsActive = false)
  → Requires role: Admin
  → Does NOT delete batches; they remain but medicine is marked inactive

BUSINESS RULES:
---------------
✅ Medicine Code must be unique across all medicines
✅ Medicine must belong to a valid Category
✅ Deleting a medicine is soft delete (IsActive = false)
✅ TotalStock is calculated from active batches, not stored
✅ Low stock detection: TotalStock <= ReorderLevel (for active medicines)
✅ All operations are logged to AuditLog

HOW IT RELATES TO OTHER ENTITIES:
----------------------------------
- **Category**: Each medicine belongs to one category (required)
- **Batches**: Medicine has many batches; batches hold the actual stock
- **Sales**: Sales reference medicines indirectly through batches (SaleItem → Batch → Medicine)

═══════════════════════════════════════════════════════════════════════════════
3. MEDICINE BATCHES
═══════════════════════════════════════════════════════════════════════════════

WHAT IT IS:
-----------
A **Medicine Batch** represents a specific lot of a medicine received from a supplier.
Each batch has its own expiry date, purchase price, selling price, and quantity.
This is where actual stock quantities are stored and managed.

ENTITY STRUCTURE:
-----------------
- `Id` (int): Primary key
- `MedicineId` (int, FK): Must reference an existing Medicine
- `Medicine` (navigation): The medicine this batch belongs to
- `BatchNumber` (string): Unique batch/lot number (e.g., "BATCH-2024-001")
- `ExpiryDate` (DateTime): When this batch expires
- `Quantity` (int): Current stock quantity in this batch
- `PurchasePrice` (decimal): Cost per unit when purchased
- `SellingPrice` (decimal): Price per unit when sold
- `ReceivedDate` (DateTime): When batch was received
- `SupplierId` (int, FK): Supplier who provided this batch
- `Supplier` (navigation): The supplier
- `IsActive` (bool): Whether batch is active (can be sold)

CRITICAL CONCEPT - FIFO (First In, First Out):
------------------------------------------------
When selling medicines, the system uses FIFO logic:
1. Finds all active, non-expired batches for the medicine
2. Orders them by ExpiryDate (oldest expiry first)
3. Deducts stock from batches in that order
4. This ensures oldest stock is sold first, reducing waste

API ENDPOINTS:
--------------
- GET    /api/batches/GetBatchesByMedicine/{medicineId}
  → Returns all batches for a specific medicine
  → Any authenticated user can view
  
- GET    /api/batches/GetBatchById/{id}
  → Returns a single batch with medicine and supplier details
  → Any authenticated user can view
  
- POST   /api/batches/CreateBatch
  → Creates a new batch (adds stock to inventory)
  → Requires roles: Admin, Storekeeper, Pharmacist
  → Must provide valid MedicineId
  → If SupplierId is 0, uses first available supplier
  
- PUT    /api/batches/UpdateBatch/{id}
  → Updates batch properties
  → Requires roles: Admin, Storekeeper, Pharmacist
  → Can update: BatchNumber, ExpiryDate, Quantity, PurchasePrice, SellingPrice,
                SupplierId, IsActive
  
- POST   /api/batches/AdjustStock/{id}
  → Manually adjusts batch quantity (for corrections, damage, etc.)
  → Requires roles: Admin, Storekeeper, Pharmacist
  → Must provide NewQuantity and Reason
  
- DELETE /api/batches/DeleteBatch/{id}
  → Hard deletes a batch (use with caution)
  → Requires role: Admin
  → ⚠️ Should not delete batches that have been sold (SaleItems reference them)

BUSINESS RULES:
---------------
✅ Batch must belong to a valid Medicine
✅ Batch must have a Supplier (defaults to first supplier if SupplierId = 0)
✅ Quantity cannot go negative (enforced by Sales service)
✅ Expired batches (ExpiryDate < today) cannot be sold
✅ Only active batches (IsActive = true) can be sold
✅ Stock adjustments are logged with reason
✅ All operations are logged to AuditLog

HOW IT RELATES TO OTHER ENTITIES:
----------------------------------
- **Medicine**: Batch belongs to one medicine; medicine has many batches
- **Supplier**: Batch comes from one supplier
- **Sales**: When a sale occurs, SaleItems reference specific batches and deduct quantities
- **Stock Calculation**: Medicine.TotalStock = Sum of all active batch quantities

═══════════════════════════════════════════════════════════════════════════════
4. SALES
═══════════════════════════════════════════════════════════════════════════════

WHAT IT IS:
-----------
A **Sale** represents a transaction where medicines are sold to a customer.
Sales deduct stock from batches using FIFO logic and record financial information.

ENTITY STRUCTURE:
-----------------
**Sale Entity:**
- `Id` (int): Primary key
- `InvoiceNumber` (string): Auto-generated (e.g., "INV-123")
- `SaleDate` (DateTime): When the sale occurred
- `TotalAmount` (decimal): Sum of all line items
- `PaymentMethod` (string, optional): e.g., "Cash", "Card"
- `IsCancelled` (bool): Whether sale was cancelled (stock restored)
- `CreatedByUserId` (int?, FK): User who created the sale
- `SoldByUserId` (int, FK): User who processed the sale
- `SoldByUser` (navigation): The user
- `Items` (collection): All SaleItems in this sale

**SaleItem Entity:**
- `Id` (int): Primary key
- `SaleId` (int, FK): The sale this item belongs to
- `Sale` (navigation): The sale
- `MedicineBatchId` (int, FK): **CRITICAL** - References the specific batch sold
- `MedicineBatch` (navigation): The batch
- `Quantity` (int): How many units sold from this batch
- `UnitPrice` (decimal): Price per unit (from batch.SellingPrice at time of sale)

CRITICAL BUSINESS LOGIC - FIFO STOCK DEDUCTION:
------------------------------------------------
When creating a sale, the system:

1. **Validates** each medicine exists and quantity > 0

2. **For each medicine in the sale:**
   - Finds all active, non-expired batches (ExpiryDate >= today)
   - Orders by ExpiryDate (oldest first = FIFO)
   - Checks total available stock >= requested quantity
   - If insufficient → throws error (cannot sell expired or more than available)

3. **Allocates stock from batches:**
   - Takes from oldest-expiring batch first
   - If batch doesn't have enough, takes remainder from next batch
   - Creates SaleItem for each batch used (stores BatchId, Quantity, UnitPrice)

4. **Executes in a single database transaction:**
   - Creates Sale record
   - Creates all SaleItem records
   - Deducts quantities from batches
   - Calculates TotalAmount
   - Generates InvoiceNumber
   - If ANY step fails → entire transaction rolls back

5. **Logs audit trail**

API ENDPOINTS:
--------------
- POST   /api/sales
  → Creates a new sale
  → Requires roles: Admin, Pharmacist, Cashier
  → Request body:
    {
      "items": [
        { "medicineId": 1, "quantity": 2 },
        { "medicineId": 2, "quantity": 1 }
      ],
      "paymentMethod": "Cash"
    }
  → Automatically:
    - Finds batches (FIFO, non-expired)
    - Deducts stock
    - Creates Sale and SaleItems
    - Generates invoice number
    - Returns full sale details
  
- GET    /api/sales
  → Returns paginated list of sales
  → Query parameters:
    - fromDate (optional): Filter sales from this date
    - toDate (optional): Filter sales to this date
    - soldByUserId (optional): Filter by user
    - page (default: 1)
    - pageSize (default: 20, max: 100)
  → Any authenticated user can view
  
- GET    /api/sales/{id}
  → Returns a single sale with full details
  → Includes: Sale info, all SaleItems with batch and medicine details
  → Used for receipt printing / sale details view
  → Any authenticated user can view
  
- POST   /api/sales/{id}/cancel
  → Cancels a sale (restores stock)
  → Requires role: Admin only
  → Logic:
    - Checks sale exists and is not already cancelled
    - In transaction:
      - For each SaleItem: adds Quantity back to MedicineBatch
      - Sets Sale.IsCancelled = true
    - Does NOT delete the sale (preserves history)
    - Logs audit trail

BUSINESS RULES:
---------------
✅ Cannot sell expired batches (ExpiryDate < today)
✅ Cannot sell more than available stock
✅ Always uses FIFO (oldest expiry first)
✅ Must store BatchId in SaleItem (for traceability)
✅ Sale creation is atomic (all-or-nothing transaction)
✅ Cancel restores stock but does NOT delete sale
✅ Cannot cancel an already-cancelled sale
✅ All operations are logged to AuditLog

HOW IT RELATES TO OTHER ENTITIES:
----------------------------------
- **Medicines**: Sales reference medicines indirectly through batches
- **Batches**: Sales deduct stock from batches; SaleItems store BatchId
- **Users**: Sales track who created/sold (SoldByUserId)
- **Financial**: TotalAmount = sum of (SaleItem.Quantity × SaleItem.UnitPrice)

═══════════════════════════════════════════════════════════════════════════════
5. RELATIONSHIPS & DATA FLOW
═══════════════════════════════════════════════════════════════════════════════

HIERARCHY:
----------
```
MedicineCategory (1) ──┐
                       │
                       ├──> Medicine (many)
                       │      │
                       │      └──> MedicineBatch (many)
                       │             │
                       │             └──> SaleItem (many)
                       │                    │
                       │                    └──> Sale (1)
```

DATA FLOW EXAMPLE - COMPLETE SALE PROCESS:
------------------------------------------
1. **Setup Phase:**
   - Admin creates Category: "Antibiotics"
   - Admin creates Medicine: "Amoxicillin 500mg" (CategoryId = Antibiotics)
   - Storekeeper creates Batch: MedicineId = Amoxicillin, Quantity = 100, ExpiryDate = 2025-12-31

2. **Stock Calculation:**
   - Medicine.TotalStock = Sum of all active batches = 100
   - If TotalStock <= ReorderLevel → Low stock alert

3. **Sale Phase:**
   - Cashier creates Sale: items = [{ medicineId: Amoxicillin, quantity: 5 }]
   - System finds batches: Batch with ExpiryDate = 2025-12-31 (only one)
   - Checks: Batch.Quantity (100) >= requested (5) ✅
   - Creates SaleItem: BatchId = batch.Id, Quantity = 5, UnitPrice = batch.SellingPrice
   - Deducts: Batch.Quantity = 100 - 5 = 95
   - Medicine.TotalStock now = 95

4. **Cancellation (if needed):**
   - Admin cancels Sale
   - System restores: Batch.Quantity = 95 + 5 = 100
   - Sale.IsCancelled = true (sale record remains)

KEY RELATIONSHIPS:
------------------
- **Category → Medicine**: One-to-Many (one category has many medicines)
- **Medicine → Batch**: One-to-Many (one medicine has many batches)
- **Batch → SaleItem**: One-to-Many (one batch can be sold in multiple sales)
- **Sale → SaleItem**: One-to-Many (one sale has many items)
- **SaleItem → Batch**: Many-to-One (each item references one batch)

STOCK MANAGEMENT:
----------------
- **Stock is stored in Batches, NOT in Medicines**
- Medicine.TotalStock = calculated field (sum of batch quantities)
- When batch quantity changes → Medicine.TotalStock automatically reflects it
- Low stock detection: Medicine.TotalStock <= Medicine.ReorderLevel

═══════════════════════════════════════════════════════════════════════════════
6. USER ROLES & AUTHORIZATION
═══════════════════════════════════════════════════════════════════════════════

ROLES IN THE SYSTEM:
--------------------
- **Admin**: Full access to everything
- **Pharmacist**: Can manage medicines, batches, categories, and process sales
- **Storekeeper**: Can manage medicines, batches, categories (inventory management)
- **Cashier**: Can process sales (view medicines, create sales)
- **Viewer**: Read-only access (if implemented)

MEDICINE CATEGORIES - ROLE PERMISSIONS:
---------------------------------------
- **View (GET)**: All authenticated users
- **Create (POST)**: Admin, Storekeeper, Pharmacist
- **Delete (DELETE)**: Admin only

MEDICINES - ROLE PERMISSIONS:
------------------------------
- **View (GET)**: All authenticated users
- **Create (POST)**: Admin, Storekeeper, Pharmacist
- **Update (PUT)**: Admin, Storekeeper, Pharmacist
- **Delete (DELETE)**: Admin only

MEDICINE BATCHES - ROLE PERMISSIONS:
------------------------------------
- **View (GET)**: All authenticated users
- **Create (POST)**: Admin, Storekeeper, Pharmacist
- **Update (PUT)**: Admin, Storekeeper, Pharmacist
- **Adjust Stock (POST AdjustStock)**: Admin, Storekeeper, Pharmacist
- **Delete (DELETE)**: Admin only

SALES - ROLE PERMISSIONS:
--------------------------
- **Create Sale (POST)**: Admin, Pharmacist, Cashier
- **View Sales (GET)**: All authenticated users
- **Cancel Sale (POST Cancel)**: Admin only

AUTHORIZATION ATTRIBUTES:
-------------------------
Controllers use `[Authorize]` attributes:
- `[Authorize]`: Any authenticated user
- `[Authorize(Roles = "Admin")]`: Admin only
- `[Authorize(Roles = "Admin,Pharmacist")]`: Admin OR Pharmacist
- `[AllowAnonymous]`: No auth required (not used in these controllers)

EXAMPLE WORKFLOW BY ROLE:
--------------------------
**Admin:**
- Can do everything: create categories, medicines, batches, process sales, cancel sales

**Pharmacist:**
- Can create/update medicines and batches
- Can process sales
- Cannot cancel sales (Admin only)
- Cannot delete medicines/categories (Admin only)

**Storekeeper:**
- Can create/update medicines and batches
- Can adjust stock
- Cannot process sales
- Cannot delete medicines/categories (Admin only)

**Cashier:**
- Can view medicines and batches
- Can process sales
- Cannot create/update medicines or batches
- Cannot cancel sales

═══════════════════════════════════════════════════════════════════════════════
7. AUDIT LOGGING
═══════════════════════════════════════════════════════════════════════════════

All operations are logged to the AuditLog table:
- **Who**: UserId (from JWT token)
- **What**: Action name (e.g., "CreateMedicine", "CreateSale", "CancelSale")
- **Entity**: Entity name (e.g., "Medicine", "Sale")
- **EntityId**: ID of the affected entity
- **OldValues**: JSON of state before change (if applicable)
- **NewValues**: JSON of state after change (if applicable)
- **IPAddress**: Client IP address
- **When**: CreatedAt timestamp

This provides a complete audit trail for compliance and troubleshooting.

═══════════════════════════════════════════════════════════════════════════════
8. KEY TAKEAWAYS
═══════════════════════════════════════════════════════════════════════════════

✅ **Stock is stored in Batches, not Medicines**
   - Medicine.TotalStock is calculated, not stored

✅ **FIFO is enforced automatically**
   - Sales always use oldest-expiring batches first

✅ **Expired batches cannot be sold**
   - System checks ExpiryDate >= today before allowing sale

✅ **Sales are transactional**
   - All-or-nothing: if any part fails, entire sale rolls back

✅ **Cancellation restores stock**
   - Cancel adds quantities back to batches
   - Sale record remains (IsCancelled = true)

✅ **BatchId is stored in SaleItem**
   - Full traceability: know exactly which batch was sold

✅ **Soft delete for medicines**
   - Medicines are disabled (IsActive = false), not deleted
   - Batches remain but medicine is inactive

✅ **Role-based access control**
   - Different roles have different permissions
   - Admin has full access, others are restricted

✅ **Complete audit trail**
   - All operations logged with user, timestamp, and changes

═══════════════════════════════════════════════════════════════════════════════
END OF DOCUMENT
═══════════════════════════════════════════════════════════════════════════════
