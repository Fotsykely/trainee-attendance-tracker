using Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public static class TraineeSeeder
{
    // The training centre's trainees, in the order they are listed everywhere.
    public static readonly string[] TraineeNames = ["Rado", "Soa", "Nirina", "Toky", "Fenitra", "Mialy"];

    // Inserts nothing when the database already has trainees: restarting the API never creates duplicates.
    // No attendance is invented: every day starts empty.
    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Trainees.AnyAsync(cancellationToken))
            return;

        db.Trainees.AddRange(TraineeNames.Select(name => new Trainee { Name = name }));
        await db.SaveChangesAsync(cancellationToken);
    }
}
