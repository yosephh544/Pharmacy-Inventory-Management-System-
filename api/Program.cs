using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// JWT Authentication Configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_which_is_at_least_32_characters_long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "pharmacy";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "pharmacy_clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };
});

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<PharmacyDbContext>(options =>
{
    options
        .UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.MaxBatchSize(1))
        // Log parameter values + generated SQL so we can see the exact failing statement
        .EnableSensitiveDataLogging()
        .LogTo(
            Console.WriteLine,
            new[]
            {
                DbLoggerCategory.Database.Command.Name,
                DbLoggerCategory.Update.Name
            },
            LogLevel.Information);
});


builder.Services.AddSwaggerGen(c =>
{
	c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Pharmacy Inventory API", Version = "v1" });
    
    // JWT Authorization in Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IMedicineService, MedicineService>();
builder.Services.AddScoped<IMedicineBatchService, MedicineBatchService>();
builder.Services.AddScoped<IMedicineCategoryService, MedicineCategoryService>();
builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<IReportsService, ReportsService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpContextAccessor();



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseDeveloperExceptionPage();
	app.UseSwagger();
	app.UseSwaggerUI(options =>
	{
		options.RoutePrefix = string.Empty; // serve Swagger UI at app root
		options.SwaggerEndpoint("/swagger/v1/swagger.json", "Pharmacy Inventory API v1");
	});
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "Hello World!");

// Seed a default dev user/profile for testing via Swagger/Curl
using (var scope = app.Services.CreateScope())
{
	var db = scope.ServiceProvider.GetRequiredService<PharmacyDbContext>();
	var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

	if (!db.Set<Infrustructure.Entities.PharmacyProfile>().Any())
	{
		var profile = new Infrustructure.Entities.PharmacyProfile
		{
			Name = "Default Pharmacy",
			Code = "DEFAULT",
			Address = "Localhost",
			Phone = "0000000000"
		};
		db.Set<Infrustructure.Entities.PharmacyProfile>().Add(profile);
		db.SaveChanges();
	}

	// Seed default roles
	if (!db.Roles.Any())
	{
		var roles = new[]
		{
			new Role { Name = "Admin", CreatedAt = DateTime.UtcNow },
			new Role { Name = "Pharmacist", CreatedAt = DateTime.UtcNow },
			new Role { Name = "Cashier", CreatedAt = DateTime.UtcNow },
			new Role { Name = "Viewer", CreatedAt = DateTime.UtcNow }
		};
		db.Roles.AddRange(roles);
		db.SaveChanges();
		Console.WriteLine("DevSeed: Created default roles (Admin, Pharmacist, Cashier, Viewer)");
	}

	var adminUser = db.Users.FirstOrDefault(u => u.Username == "admin");
	if (adminUser == null)
	{
		var profile = db.Set<Infrustructure.Entities.PharmacyProfile>().FirstOrDefault() 
            ?? new Infrustructure.Entities.PharmacyProfile { Name = "Default", Code = "DEF", Address = "Local", Phone = "000" };
        
        if (profile.Id == 0) {
            db.Set<Infrustructure.Entities.PharmacyProfile>().Add(profile);
            db.SaveChanges();
        }

		adminUser = new User
		{
			Username = "admin",
			FullName = "Admin User",
			PharmacyProfileId = profile.Id,
			IsActive = true
		};
		adminUser.PasswordHash = hasher.HashPassword(adminUser, "123");
		db.Users.Add(adminUser);
		db.SaveChanges();
		Console.WriteLine("DevSeed: Created admin user");
	}

	var adminRole = db.Roles.FirstOrDefault(r => r.Name == "Admin");
    if (adminRole == null) {
        adminRole = new Role { Name = "Admin", CreatedAt = DateTime.UtcNow };
        db.Roles.Add(adminRole);
        db.SaveChanges();
    }

	if (!db.UserRoles.Any(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id))
	{
		db.UserRoles.Add(new Infrustructure.Entities.UserRole
		{
			UserId = adminUser.Id,
			RoleId = adminRole.Id
		});
		db.SaveChanges();
		Console.WriteLine("DevSeed: Assigned Admin role to admin user");
	}

	// Seed a default supplier so batches can be created even when SupplierId is not explicitly provided
	if (!db.Suppliers.Any())
	{
		var supplier = new Supplier
		{
			Name = "Default Supplier",
			Phone = "0000000000",
			Address = "Unknown",
			Email = null,
			LicenseNumber = null,
			CreatedAt = DateTime.UtcNow
		};
		db.Suppliers.Add(supplier);
		db.SaveChanges();
		Console.WriteLine("DevSeed: Created default supplier");
	}
}


app.Run();
