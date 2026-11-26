namespace Api.Entities;

public class Trainee
{
    // Shared by the database schema and the seed data.
    public const int NameMaxLength = 50;

    public int Id { get; set; }
    public required string Name { get; set; }
}
