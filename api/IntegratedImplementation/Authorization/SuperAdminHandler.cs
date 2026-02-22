using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using System.Threading.Tasks;

namespace IntegratedImplementation.Authorization
{
    /// <summary>
    /// This handler allows any user with the "SuperAdmin" role to pass any role-based requirement.
    /// It functions as a global "God Mode" for the SuperAdmin user.
    /// </summary>
    public class SuperAdminHandler : AuthorizationHandler<RolesAuthorizationRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RolesAuthorizationRequirement requirement)
        {
            // Check if the user has the "SuperAdmin" role
            if (context.User.IsInRole("SuperAdmin"))
            {
                // Succeed the requirement for SuperAdmin
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
