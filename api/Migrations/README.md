# Database migrations

## After cloning the project (other computers / repos)

1. **Restore and build:**
   ```bash
   cd api
   dotnet restore
   dotnet build
   ```

2. **Update the database** (do **not** run `migrations add` on a clone):
   ```bash
   dotnet ef database update --project Api.csproj
   ```
   This applies, in order:
   - `InitialCreate` – creates all tables
   - `AddIsCancelledToSale` – adds `IsCancelled` to Sales
   - `SyncSchemaToCurrentEntities` – drops legacy columns so the schema matches the current entity classes

   You get the **same tables and columns** on every machine.

3. **Run the API** as usual. The DbContext and entities match the migrated schema.

## When to add a new migration

Only on your **main dev machine** after you change:

- Entity classes (e.g. new property, new entity)
- `PharmacyDbContext` (new `DbSet`, `OnModelCreating` changes)

Then:

```bash
dotnet ef migrations add YourMigrationName --project Api.csproj
```

Commit the new migration files and the updated `PharmacyDbContextModelSnapshot.cs` so clones can run `database update` and get the same schema.

## Context and entities in sync

- **Table names:** `PharmacyProfile` is mapped to table `PharmacyProfile` (not plural) so it matches `InitialCreate` and all clones.
- **BaseEntity:** All entities that inherit `BaseEntity` have `Id`, `CreatedAt`, and `IsDeleted`; `IsDeleted` is configured as required with default `false` so migrations are consistent.
- **Medicine:** Only `CategoryId` is used (no `MedicineCategoryId`). Relationship is `Medicine.Category` ↔ `MedicineCategory.Medicines`.
- **Purchase / Sale:** `CreatedByUser` and `SoldByUser` are configured with their FKs; legacy `CreatedBy` columns are removed by `SyncSchemaToCurrentEntities`.
- **Payment:** The `Payment` entity exists in code but is **not** in `PharmacyDbContext`, so there is no `Payments` table. Add a `DbSet<Payment>` and a migration if you need it.
