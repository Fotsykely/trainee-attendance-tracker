using System.Globalization;
using Api.Attendance;
using Api.Data;
using Api.Dtos;
using Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/attendance")]
public class AttendanceController(AppDbContext db, TimeProvider time) : ControllerBase
{
    private const string DateFormat = "yyyy-MM-dd";

    // Literal route: it wins over "{date}" for the URL /api/attendance/summary.
    [HttpGet("summary")]
    public async Task<ActionResult<List<TraineeSummaryDto>>> GetSummary(
        [FromQuery] string? from,
        [FromQuery] string? to,
        CancellationToken cancellationToken)
    {
        var fromDate = ParseDate(from, "from", "La date de début");
        var toDate = ParseDate(to, "to", "La date de fin");

        if (fromDate is not null && toDate is not null && toDate < fromDate)
            ModelState.AddModelError("to", "La date de fin ne peut pas précéder la date de début.");

        if (!ModelState.IsValid)
            return ValidationProblem();

        var firstDay = fromDate!.Value;
        var lastDay = toDate!.Value;
        var trainees = await db.Trainees.OrderBy(t => t.Id).ToListAsync(cancellationToken);
        var records = await db.AttendanceRecords
            .Where(r => r.Date >= firstDay && r.Date <= lastDay)
            .ToListAsync(cancellationToken);

        return AttendanceSummaryCalculator.Calculate(trainees, records);
    }

    [HttpGet("{date}")]
    public async Task<ActionResult<AttendanceDayDto>> GetDay(string date, CancellationToken cancellationToken)
    {
        var day = ParseDate(date, "date", "La date");
        if (day is null)
            return ValidationProblem();

        return await ReadDayAsync(day.Value, cancellationToken);
    }

    // Saves the whole day at once. Saving a day that already exists updates it: the pair
    // (trainee, date) is never inserted twice.
    [HttpPut("{date}")]
    public async Task<ActionResult<AttendanceDayDto>> SaveDay(
        string date,
        SaveAttendanceRequestDto request,
        CancellationToken cancellationToken)
    {
        var day = ParseDate(date, "date", "La date");
        if (day is not null && day > Today())
            ModelState.AddModelError("date", "Impossible de pointer une date future.");

        var trainees = await db.Trainees.OrderBy(t => t.Id).ToListAsync(cancellationToken);
        var statuses = ReadStatuses(request.Entries!, trainees);

        if (!ModelState.IsValid)
            return ValidationProblem();

        try
        {
            await UpsertAsync(day!.Value, trainees, statuses, cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.IsDuplicateKey())
        {
            // Two requests saved the same new day at the same moment and the other one won:
            // start again from a clean state, the rows now exist and will be updated.
            db.ChangeTracker.Clear();
            await UpsertAsync(day!.Value, trainees, statuses, cancellationToken);
        }

        return await ReadDayAsync(day.Value, cancellationToken);
    }

    // Checks that each trainee appears exactly once with a status, and returns the status of each trainee.
    // Problems are added to the ModelState, one message per kind.
    private Dictionary<int, AttendanceStatus> ReadStatuses(
        List<AttendanceEntryRequestDto> entries,
        List<Trainee> trainees)
    {
        var knownIds = trainees.Select(t => t.Id).ToHashSet();
        var statuses = new Dictionary<int, AttendanceStatus>();
        var hasUnknown = false;
        var hasDuplicate = false;

        foreach (var entry in entries)
        {
            if (!knownIds.Contains(entry.TraineeId))
                hasUnknown = true;
            else if (statuses.ContainsKey(entry.TraineeId))
                hasDuplicate = true;
            else if (entry.Status is { } status)
                statuses[entry.TraineeId] = status;
        }

        if (hasUnknown)
            ModelState.AddModelError("Entries", "La liste contient un stagiaire inconnu.");
        if (hasDuplicate)
            ModelState.AddModelError("Entries", "Un stagiaire ne peut apparaître qu'une seule fois.");

        var missing = trainees.Where(t => !statuses.ContainsKey(t.Id)).Select(t => t.Name).ToList();
        if (missing.Count > 0)
            ModelState.AddModelError("Entries", $"Choisissez un état pour : {string.Join(", ", missing)}.");

        return statuses;
    }

    private async Task UpsertAsync(
        DateOnly day,
        List<Trainee> trainees,
        Dictionary<int, AttendanceStatus> statuses,
        CancellationToken cancellationToken)
    {
        var existing = await db.AttendanceRecords
            .Where(r => r.Date == day)
            .ToDictionaryAsync(r => r.TraineeId, cancellationToken);

        foreach (var trainee in trainees)
        {
            if (existing.TryGetValue(trainee.Id, out var record))
                record.Status = statuses[trainee.Id];
            else
                db.AttendanceRecords.Add(new AttendanceRecord { TraineeId = trainee.Id, Date = day, Status = statuses[trainee.Id] });
        }

        // One SaveChanges is one transaction: the whole list is saved, or nothing is.
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AttendanceDayDto> ReadDayAsync(DateOnly day, CancellationToken cancellationToken)
    {
        var trainees = await db.Trainees.OrderBy(t => t.Id).ToListAsync(cancellationToken);
        var statuses = await db.AttendanceRecords
            .Where(r => r.Date == day)
            .ToDictionaryAsync(r => r.TraineeId, r => r.Status, cancellationToken);

        var entries = trainees
            .Select(t => new AttendanceEntryDto(t.Id, t.Name, statuses.TryGetValue(t.Id, out var status) ? status : null))
            .ToList();

        return new AttendanceDayDto(day, statuses.Count > 0, entries);
    }

    private DateOnly Today() => DateOnly.FromDateTime(time.GetLocalNow().DateTime);

    // Strict "yyyy-MM-dd" (no culture-dependent formats). On failure, adds a message under `field`
    // and returns null.
    private DateOnly? ParseDate(string? text, string field, string label)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            ModelState.AddModelError(field, $"{label} est obligatoire.");
            return null;
        }

        if (DateOnly.TryParseExact(text, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return parsed;

        ModelState.AddModelError(field, $"{label} n'est pas valide (format attendu : AAAA-MM-JJ).");
        return null;
    }
}
