namespace IntegratedImplementation.DTOs.Role
{
    public class RoleResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int UserCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RoleListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int UserCount { get; set; }
    }

    public class CreateRoleRequestDto
    {
        public string Name { get; set; } = null!;
    }
}
