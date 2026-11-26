using Api.Attendance;
using Api.Entities;

namespace Api.Tests;

// The summary rules alone, without a database.
public class AttendanceSummaryCalculatorTests
{
    private static readonly Trainee Rado = new() { Id = 1, Name = "Rado" };
    private static readonly Trainee Soa = new() { Id = 2, Name = "Soa" };

    [Fact]
    public void Late_days_count_as_attended_in_the_rate()
    {
        var records = Records(Rado, AttendanceStatus.Present, AttendanceStatus.Present, AttendanceStatus.Late, AttendanceStatus.Absent);

        var line = Assert.Single(AttendanceSummaryCalculator.Calculate([Rado], records));

        Assert.Equal(2, line.PresentDays);
        Assert.Equal(1, line.LateDays);
        Assert.Equal(1, line.AbsentDays);
        Assert.Equal(4, line.RecordedDays);
        Assert.Equal(75.0m, line.AttendanceRate);
    }

    [Fact]
    public void Rate_is_rounded_to_one_decimal()
    {
        var twoThirds = Records(Rado, AttendanceStatus.Present, AttendanceStatus.Late, AttendanceStatus.Absent);

        Assert.Equal(66.7m, Assert.Single(AttendanceSummaryCalculator.Calculate([Rado], twoThirds)).AttendanceRate);
    }

    [Fact]
    public void Rate_rounds_a_midpoint_up()
    {
        // 1 day out of 16 = 6.25 %: rounded away from zero to 6.3, not to the even neighbour 6.2.
        var statuses = new[] { AttendanceStatus.Present }.Concat(Enumerable.Repeat(AttendanceStatus.Absent, 15)).ToArray();

        var line = Assert.Single(AttendanceSummaryCalculator.Calculate([Rado], Records(Rado, statuses)));

        Assert.Equal(6.3m, line.AttendanceRate);
    }

    [Fact]
    public void Trainee_without_any_record_has_zeros_and_no_rate()
    {
        var line = Assert.Single(AttendanceSummaryCalculator.Calculate([Rado], []));

        Assert.Equal(0, line.PresentDays);
        Assert.Equal(0, line.LateDays);
        Assert.Equal(0, line.AbsentDays);
        Assert.Equal(0, line.RecordedDays);
        Assert.Null(line.AttendanceRate);
    }

    [Fact]
    public void Trainee_always_absent_has_a_real_zero_percent_rate()
    {
        var records = Records(Rado, AttendanceStatus.Absent, AttendanceStatus.Absent);

        var line = Assert.Single(AttendanceSummaryCalculator.Calculate([Rado], records));

        Assert.Equal(0.0m, line.AttendanceRate);
    }

    [Fact]
    public void Each_trainee_is_counted_on_their_own_records_and_the_order_is_kept()
    {
        var records = Records(Rado, AttendanceStatus.Present).Concat(Records(Soa, AttendanceStatus.Absent, AttendanceStatus.Absent)).ToList();

        var lines = AttendanceSummaryCalculator.Calculate([Soa, Rado], records);

        Assert.Equal(["Soa", "Rado"], lines.Select(l => l.TraineeName));
        Assert.Equal(0.0m, lines[0].AttendanceRate);
        Assert.Equal(100.0m, lines[1].AttendanceRate);
    }

    private static List<AttendanceRecord> Records(Trainee trainee, params AttendanceStatus[] statuses) =>
        statuses
            .Select((status, index) => new AttendanceRecord
            {
                TraineeId = trainee.Id,
                Date = new DateOnly(2030, 1, 1).AddDays(index),
                Status = status,
            })
            .ToList();
}
