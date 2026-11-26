using Api.Dtos;
using Api.Entities;

namespace Api.Attendance;

// The summary rules, free of any database code so they can be tested alone.
public static class AttendanceSummaryCalculator
{
    // One line per trainee, in the order given, including trainees without any record (zeros, no rate).
    // The records are expected to be already limited to the period.
    public static List<TraineeSummaryDto> Calculate(
        IEnumerable<Trainee> trainees,
        IReadOnlyCollection<AttendanceRecord> records)
    {
        var recordsByTrainee = records.ToLookup(r => r.TraineeId);

        return trainees
            .Select(trainee =>
            {
                var own = recordsByTrainee[trainee.Id].ToList();
                var present = own.Count(r => r.Status == AttendanceStatus.Present);
                var late = own.Count(r => r.Status == AttendanceStatus.Late);
                var absent = own.Count(r => r.Status == AttendanceStatus.Absent);

                return new TraineeSummaryDto(
                    trainee.Id, trainee.Name, present, late, absent, own.Count, Rate(present + late, own.Count));
            })
            .ToList();
    }

    // A late arrival counts as attended. The base is the days actually recorded for the trainee,
    // not the calendar days of the period. With no recorded day there is no rate: null is
    // shown as "—", because 0 % would wrongly say "always absent".
    private static decimal? Rate(int attendedDays, int recordedDays) =>
        recordedDays == 0
            ? null
            : Math.Round(attendedDays * 100m / recordedDays, 1, MidpointRounding.AwayFromZero);
}
