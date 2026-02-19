namespace IntegratedImplementation.DTOs.Medicines
{
    public class MedicineCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public class CreateMedicineCategoryDto
    {
        public string Name { get; set; } = null!;
    }
}
