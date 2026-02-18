using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy.Infrastructure.Data;
using Infrustructure.Entities;

namespace IntegratedApi.Controllers
{
    [ApiController]
    [Route("api/pharmacies")]
    [Authorize(Roles = "Admin")]
    public class PharmacyProfilesController : ControllerBase
    {
        private readonly PharmacyDbContext _context;

        public PharmacyProfilesController(PharmacyDbContext context)
        {
            _context = context;
        }

        // GET: api/pharmacies
        [HttpGet]
        public async Task<IActionResult> GetPharmacies()
        {
            try
            {
                var pharmacies = await _context.Set<PharmacyProfile>()
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Code
                    })
                    .ToListAsync();

                return Ok(pharmacies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving pharmacy profiles", error = ex.Message });
            }
        }
    }
}

