using Microsoft.EntityFrameworkCore;
using Infrustructure.Entities;
using Pharmacy.Infrastructure.Data;
using IntegratedImplementation.Interfaces;
using IntegratedImplementation.Services;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
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
builder.Services.AddSwaggerGen(c =>
{
	c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Pharmacy Inventory API", Version = "v1" });
});

builder.Services.AddDbContext<PharmacyDbContext>(opts =>
	opts.UseInMemoryDatabase("PharmacyDev"));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

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

	if (!db.Users.Any(u => u.Username == "admin"))
	{
		var profile = db.Set<Infrustructure.Entities.PharmacyProfile>().First();
		var user = new User
		{
			Username = "admin",
			FullName = "Admin User",
			PharmacyProfileId = profile.Id,
			IsActive = true
		};
		// Hash the dev password "123" and persist
		user.PasswordHash = hasher.HashPassword(user, "123");
		db.Users.Add(user);
		db.SaveChanges();

		// Print the generated hash to the console for developer visibility
		Console.WriteLine($"DevSeed: admin password hash={user.PasswordHash}");
	}
}

app.Run();
