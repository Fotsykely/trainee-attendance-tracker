using System.ComponentModel.DataAnnotations;
using Api.Entities;

namespace Api.Dtos;

// Request body of PUT /api/attendance/{date}: the whole list of the day, in one go.
// Which trainees must appear, and the date rules, are checked by AttendanceController.
public class SaveAttendanceRequestDto
{
    [Required(ErrorMessage = "La liste des pointages est obligatoire.")]
    public List<AttendanceEntryRequestDto>? Entries { get; set; }
}

public class AttendanceEntryRequestDto
{
    public int TraineeId { get; set; }

    // Nullable so that a missing status is reported by the controller with the names of the trainees.
    // An unknown text ("Maybe") is refused earlier, by the JSON deserializer, with a 400 as well.
    public AttendanceStatus? Status { get; set; }
}

// One line of a day. Status is null while the trainee has not been recorded for that day.
public record AttendanceEntryDto(int TraineeId, string TraineeName, AttendanceStatus? Status);

// A whole day: every trainee, with the saved status if any. IsRecorded is false when nothing was ever saved for the day.
public record AttendanceDayDto(DateOnly Date, bool IsRecorded, List<AttendanceEntryDto> Entries);

// One line of the summary. AttendanceRate is a percentage (0 to 100, one decimal),
// and null when the trainee has no recorded day in the period.
public record TraineeSummaryDto(
    int TraineeId,
    string TraineeName,
    int PresentDays,
    int LateDays,
    int AbsentDays,
    int RecordedDays,
    decimal? AttendanceRate);

public record TraineeDto(int Id, string Name);
