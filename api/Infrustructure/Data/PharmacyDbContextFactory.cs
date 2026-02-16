using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Pharmacy.Infrastructure.Data
{
    public class PharmacyDbContextFactory : IDesignTimeDbContextFactory<PharmacyDbContext>
    {
        public PharmacyDbContext CreateDbContext(string[] args)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile($"appsettings.{env}.json", optional: true)
                .AddEnvironmentVariables();

            var configuration = builder.Build();

            var connection = configuration.GetConnectionString("DefaultConnection")
                             ?? configuration.GetConnectionString("DBPharmacy")
                             ?? configuration["ConnectionStrings:DefaultConnection"];

            if (string.IsNullOrWhiteSpace(connection))
                throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

            var optionsBuilder = new DbContextOptionsBuilder<PharmacyDbContext>();
            optionsBuilder.UseSqlServer(connection);

            return new PharmacyDbContext(optionsBuilder.Options);
        }
    }
}
