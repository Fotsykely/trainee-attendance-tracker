using Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Trainee> Trainees => Set<Trainee>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Trainee>(trainee =>
        {
            trainee.Property(t => t.Name).HasMaxLength(Trainee.NameMaxLength);
            trainee.HasIndex(t => t.Name).IsUnique();
        });

        modelBuilder.Entity<AttendanceRecord>(record =>
        {
            // The MySQL provider hands DATE values over as DateTime, so the conversion is explicit.
            record.Property(r => r.Date)
                .HasColumnType("date")
                .HasConversion(date => date.ToDateTime(TimeOnly.MinValue), dateTime => DateOnly.FromDateTime(dateTime));

            // The status is stored as text ("Present", "Absent", "Late"): readable directly in SQL.
            record.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);

            // The guarantee behind "no duplicates": one row per trainee and per day.
            record.HasIndex(r => new { r.TraineeId, r.Date }).IsUnique();

            // The summary and the day views filter on the date alone.
            record.HasIndex(r => r.Date);

            record.HasOne(r => r.Trainee).WithMany().HasForeignKey(r => r.TraineeId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
