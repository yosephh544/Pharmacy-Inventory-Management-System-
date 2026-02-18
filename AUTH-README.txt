PHARMACY INVENTORY SYSTEM - AUTH, USERS, ROLES
================================================

This document explains in simple terms how **authentication**, **users**, and **roles**
work in this system, and how the main pieces fit together.

The code lives mainly in:
- API startup and configuration:        `api/Program.cs`
- Auth controller + service:            `api/IntegratedApi/Controllers/AuthController.cs`
                                        `api/IntegratedImplementation/Services/AuthService.cs`
- User controller + service + entities: `api/IntegratedApi/Controllers/UserController.cs`
                                        `api/IntegratedImplementation/Services/UserService.cs`
                                        `api/Infrustructure/Entities/User.cs`
- Role controller + service + entities: `api/IntegratedApi/Controllers/RolesController.cs`
                                        `api/IntegratedImplementation/Services/RoleService.cs`
                                        `api/Infrustructure/Entities/Role.cs`
                                        `api/Infrustructure/Entities/UserRole.cs`

CONFIGURATION (JWT SETTINGS)
----------------------------
JWT = "JSON Web Token". This is a signed string the API issues after login.
The frontend sends the token on every request as proof of identity.

Settings are in `api/appsettings.json` under `"Jwt"`:

- `Jwt:Key`      : Secret signing key used to sign tokens.
                   Example dev value in this project:
                   `ReplaceWithSecureDevKeyChangeMeWhenReadyCauseIaintReadyNow`
                   In production this **must** be long, random, and kept secret.
- `Jwt:Issuer`   : Who created the token, e.g. `"PharmacyInventory"`.
- `Jwt:Audience` : Who the token is meant for, e.g. `"PharmacyClients"`.
- `Jwt:AccessTokenExpirationMinutes` : How long access tokens stay valid (e.g. 30 minutes).

`Program.cs` reads these values and wires up JWT authentication:
- It sets the JWT bearer options to validate:
  - Issuer (must match `Jwt:Issuer`)
  - Audience (must match `Jwt:Audience`)
  - Lifetime (not expired)
  - Signature (using `Jwt:Key`)
- It also tells ASP.NET Core which claim contains:
  - The user role: `ClaimTypes.Role`
  - The user name: `ClaimTypes.Name`

HOW LOGIN WORKS
---------------
Endpoint: `POST /api/auth/login`
File:     `AuthController.cs` / `AuthService.cs`

1. Client sends login data:
   - JSON body (`LoginRequestDto`):
     - `username`
     - `password`

2. `AuthController.Login` calls `AuthService.LoginAsync`.

3. `AuthService.LoginAsync` does the following:
   - Looks up the user in the DB (`PharmacyDbContext.Users`) by username.
     - Includes `UserRoles` and `Role` so we know which roles the user has.
   - If **no user** is found or the user is **inactive** (`IsActive = false`):
     - Throws `UnauthorizedAccessException("Invalid credentials")`.
   - Uses `IPasswordHasher<User>` to verify the entered password against `User.PasswordHash`.
     - If verification fails → throws `UnauthorizedAccessException("Invalid credentials")`.
   - If credentials are valid:
     - Generates a JWT access token using `GenerateAccessToken(user)`:
       - Adds claims:
         - `NameIdentifier` = user.Id
         - `Name`          = user.Username
         - `fullName`      = user.FullName
         - One `Role` claim per assigned role (e.g. `"Admin"`, `"Pharmacist"`).
       - Signs token using `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`.
       - Sets expiry using `Jwt:AccessTokenExpirationMinutes`.
   - Returns an `AuthResponseDto` with:
     - `AccessToken` : the JWT string
     - `ExpiresAt`   : expiry timestamp

4. `AuthController` returns `200 OK` with that payload on success.
   On failure it returns:
   - `401 Unauthorized` with `{ "message": "Invalid credentials" }`
     if username/password or active status is wrong.
   - `5xx` for unexpected errors.

5. The frontend stores the `AccessToken` in local storage under `token`.
   `client/src/services/api.ts` automatically adds it as:
   - `Authorization: Bearer <token>` on every request.

HOW AUTHORIZATION WORKS (WHO CAN CALL WHAT)
-------------------------------------------
Authorization uses attributes on controllers/actions:

- `[Authorize]`           : User must be authenticated (valid JWT).
- `[Authorize(Roles = "Admin")]` : User must be authenticated **and** have Role `Admin`.
- `[AllowAnonymous]`      : No auth required (e.g. login).

Key places:

- `AuthController` (`/api/auth`):
  - `[AllowAnonymous]` on `POST /login` so anyone can attempt login.

- `UserController` (`/api/users`):
  - `[Authorize(Roles = "Admin")]` on the whole controller:
    - Only logged-in admins can manage users.

- `RolesController` (`/api/roles`):
  - `[Authorize(Roles = "Admin")]`:
    - Only admins can list, create, or delete roles.

The JWT contains role claims (one per role). When a request arrives:
- The JWT middleware validates the token.
- If ok, ASP.NET builds a `ClaimsPrincipal` with those role claims.
- `[Authorize(Roles = "Admin")]` checks whether the user has a `"Admin"` role claim.

USER MODEL AND LIFECYCLE
------------------------
Entity: `Infrustructure.Entities.User`

Key properties:
- `Id` (from `BaseEntity`)        : Integer primary key.
- `CreatedAt` (from `BaseEntity`) : When the row was created.
- `FullName`                      : Display name.
- `Username`                      : Unique login name.
- `PasswordHash`                  : Hashed password (never store plain text).
- `PharmacyProfileId`             : Foreign key to `PharmacyProfile` (which branch/store they belong to).
- `PharmacyProfile`               : Navigation property.
- `UserRoles`                     : Collection of `UserRole` links to `Role`.
- `IsActive`                      : Whether the account is active.

DTOs (data shapes exposed via API):
- `UserListItemDto`  : Used in list endpoints; includes basic info + roles.
- `UserResponseDto`  : Full view of a single user + `CreatedAt`.
- `CreateUserRequestDto`:
  - `FullName`
  - `Username`
  - `Password`
  - `PharmacyProfileId`
  - `RoleIds` (list of role IDs to assign)
- `UpdateUserRequestDto`:
  - `FullName?`
  - `IsActive?`
  - `RoleIds?` (optional replacement list)

USER ENDPOINTS (UserController + UserService)
--------------------------------------------
Base route: `api/users` (Admin-only).

1) GET `/api/users/GetUsers`
----------------------------
- Controller: `UserController.GetUsers()`
- Service: `UserService.GetAllUsersAsync()`

Behavior:
- Fetches only **active** users: `Where(u => u.IsActive)`.
- Includes roles via `Include(u => u.UserRoles).ThenInclude(ur => ur.Role)`.
- Maps each user to `UserListItemDto`:
  - `Id`, `FullName`, `Username`, `IsActive`, `Roles` (list of role names).
- Returns `200 OK` with JSON array of users.
- If something unexpected fails, returns `500` with a safe error message.

2) GET `/api/users/GetUserById?id=123`
-------------------------------------
- Controller: `UserController.GetUserById(int id)`
- Service: `UserService.GetUserByIdAsync(int id)`

Behavior:
- Loads the user (with roles) by `Id`.
- If not found → throws `KeyNotFoundException`, controller returns `404` with message.
- If found → returns `UserResponseDto`.

3) POST `/api/users/CreateUser`
-------------------------------
- Controller: `UserController.CreateUser(CreateUserRequestDto model)`
- Service: `UserService.CreateUserAsync(CreateUserRequestDto dto)`

Main validation steps **before** saving:

- **Unique username**:
  - Checks if any existing user has the same `Username`.
  - If yes → throws `InvalidOperationException`, controller returns `400` with a clear message.

- **Valid pharmacy profile**:
  - Checks that `PharmacyProfileId > 0` and that a row exists in `PharmacyProfile` with that ID.
  - If not → throws `InvalidOperationException("Pharmacy profile with ID X does not exist")`,
    controller returns `400` with that message.

- **Valid roles**:
  - Loops through each supplied `RoleId`, loads the `Role` from the DB.
  - If any ID does not match a role, it fails with
    `"One or more role IDs are invalid"` (400).

If all validations pass:
- Creates a new `User` entity:
  - `FullName`, `Username`, `PharmacyProfileId`, `IsActive = true`, `CreatedAt = UtcNow`.
- Hashes the password using `IPasswordHasher<User>`:
  - Stores result in `PasswordHash` (no plain passwords in DB).
- Saves the user (`_context.Users.Add(user)` + `SaveChangesAsync()`).
- Creates `UserRole` records for each `RoleId` and saves again.
- Reloads the user (with roles) and returns a `UserResponseDto`.

4) PUT `/api/users/UpdateUser/{id}`
-----------------------------------
- Controller: `UserController.UpdateUser(int id, UpdateUserRequestDto model)`
- Service: `UserService.UpdateUserAsync(int id, UpdateUserRequestDto dto)`

Behavior:
- Finds the user by `Id` (including current roles).
- If not found → throws `KeyNotFoundException`, controller returns `404`.
- If `FullName` is provided → updates it.
- If `IsActive` is provided → updates active status.
- If `RoleIds` is provided:
  - Re-validates that all roles exist (same logic as create).
  - Removes existing `UserRoles`, adds new ones for the provided IDs.
- Saves and returns updated `UserResponseDto` (with roles).

5) DELETE `/api/users/DeleteUser/{id}`
--------------------------------------
- Controller: `UserController.DeactivateUser(int id)`
- Service: `UserService.DeactivateUserAsync(int id)`

Behavior:
- Looks up the user by `Id`.
  - If not found → returns `404` with `"User with ID X not found"`.
- Sets `IsActive = false` and saves.
- Returns `200 OK` with `"User with ID X was deactivated successfully"`.

Notes:
- This is a **soft delete**:
  - User row remains in DB.
  - `IsActive` is used to hide them and prevent login.
- `GetAllUsersAsync` only returns active users, so deleted users disappear from main lists.
- `AuthService.LoginAsync` also checks `!user.IsActive` and treats that like invalid credentials,
  so deactivated users cannot log in.

ROLE MODEL AND LIFECYCLE
------------------------
Entities:
- `Role`:
  - `Id`, `Name`, `CreatedAt`
  - `UserRoles` (link table entries to users).
- `UserRole`:
  - `UserId`, `RoleId`
  - Navigation properties `User` and `Role`

DTOs (`RoleDtos.cs`):
- `RoleResponseDto`:
  - `Id`, `Name`, `UserCount`, `CreatedAt`
- `RoleListItemDto`:
  - Similar to `RoleResponseDto` but used for lists (currently not heavily used).
- `CreateRoleRequestDto`:
  - `Name`

ROLE ENDPOINTS (RolesController + RoleService)
---------------------------------------------
Base route: `api/roles` (Admin-only).

1) GET `/api/roles/GetRoles`
----------------------------
- Controller: `RolesController.GetRoles()`
- Service: `RoleService.GetAllRolesAsync()`

Behavior:
- Loads all roles with their `UserRoles`.
- Maps each to `RoleResponseDto` with:
  - `Id`, `Name`, `UserCount` (how many users are assigned), `CreatedAt`.
- Returns `200 OK` with JSON array.

2) GET `/api/roles/GetRoleById?id=123`
--------------------------------------
- Controller: `RolesController.GetRoleById(int id)`
- Service: `RoleService.GetRoleByIdAsync(id)`

Behavior:
- Loads the role by `Id` (with `UserRoles`).
- If not found → throws `KeyNotFoundException`, controller returns `404`.
- If found → returns `RoleResponseDto`.

3) POST `/api/roles/CreateRole`
-------------------------------
- Controller: `RolesController.CreateRole(CreateRoleRequestDto model)`
- Service: `RoleService.CreateRoleAsync(CreateRoleRequestDto dto)`

Behavior:
- Checks if a role with the same `Name` already exists:
  - If yes → throws `InvalidOperationException("Role 'X' already exists")`,
    controller returns `400` with that message.
- Otherwise:
  - Creates a new `Role` with `Name` and `CreatedAt = UtcNow`.
  - Saves it.
  - Returns `RoleResponseDto` with `UserCount = 0`.

4) DELETE `/api/roles/DeleteRole/{id}`
--------------------------------------
- Controller: `RolesController.DeleteRole(int id)`
- Service: `RoleService.DeleteRoleAsync(int id)`

Behavior:
- Loads the role (including `UserRoles`).
- If not found → returns `false` → controller returns `404` with `"Role with ID X not found"`.
- If found:
  - First checks **system roles**:
    - There is a static list in `RoleService`:
      - `Admin`, `Pharmacist`, `Cashier`, `Viewer`.
    - If the role is one of these → throws
      `"Cannot delete system role 'RoleName'"` and controller returns `400`.
  - Then checks if the role has any users (`role.UserRoles.Any()`):
    - If there are users → throws
      `"Cannot delete role 'RoleName' because it has N user(s) assigned"` and returns `400`.
  - If it is not a system role and has no users:
    - Hard-deletes the `Role` row from the DB.
    - Returns `true`, and controller responds with `200 OK` and message:
      `"Role with ID X was deleted successfully"`.

DEV SEEDING (DEFAULT ADMIN + ROLES)
-----------------------------------
In `Program.cs`, there is a dev-time seeding block that runs at startup:

1. Ensures at least one `PharmacyProfile` exists.
2. Ensures the default roles exist:
   - Admin, Pharmacist, Cashier, Viewer.
3. Ensures an `admin` user exists:
   - Username: `"admin"`
   - Password: `"123"` (for development/testing only)
   - Active: `IsActive = true`
   - Linked to the first `PharmacyProfile`.
4. Ensures that the `admin` user has the `Admin` role via `UserRoles`.

This makes it easy to:
- Start the API.
- Log in using admin/admin-password (`admin` / `123`).
- Use Swagger or the frontend to manage users and roles immediately.

SUMMARY
-------
- **Authentication** uses JWT:
  - Tokens issued by `AuthService`.
  - Configured via `appsettings.json` and `Program.cs`.
  - Stored on the client and sent as `Authorization: Bearer <token>`.
- **Authorization** uses roles:
  - Controllers use `[Authorize(Roles = "Admin")]` to restrict admin-only areas.
  - Roles are stored in `Role` and `UserRole` tables and embedded in JWT claims.
- **Users** are soft-deleted via `IsActive`:
  - They are hidden from lists, cannot log in, but remain for audit/history.
- **Roles** control what users can see/do:
  - System roles (Admin, Pharmacist, Cashier, Viewer) are protected from deletion.
  - Custom roles can be created and deleted with safety checks.

Use this file as a high-level map when working on or debugging auth, users, or roles.
For more detail, open the referenced C# files and follow the calls from controllers
down into services and entities.

