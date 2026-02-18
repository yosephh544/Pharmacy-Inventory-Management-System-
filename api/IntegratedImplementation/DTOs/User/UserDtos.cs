namespace IntegratedImplementation.DTOs.User
{
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class UserListItemDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    public class CreateUserRequestDto
    {
        public string FullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int PharmacyProfileId { get; set; }
        public List<int> RoleIds { get; set; } = new();
    }

    public class UpdateUserRequestDto
    {
        public string? FullName { get; set; }
        public bool? IsActive { get; set; }
        public List<int>? RoleIds { get; set; }
    }
}
