namespace Api.Entities;

// One trainee, one day, one status. The pair (TraineeId, Date) is unique in the database,
// so saving a day twice can never create duplicates (see AppDbContext).
public class AttendanceRecord
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee? Trainee { get; set; }

    // A calendar day without time of day or time zone.
    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
}
