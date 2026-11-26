using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Api.Data;
using Api.Dtos;
using Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MySql.Data.MySqlClient;

namespace Api.Tests;

// The clock of ApiFactory says "today" is 2030-06-15. The database is shared by the whole test run,
// so each test uses its own dates and never relies on another test's data.
[Collection(ApiCollection.Name)]
public class AttendanceEndpointsTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Saved_day_is_returned_with_its_statuses()
    {
        var ids = await TraineeIdsAsync();
        var entries = ids.Select((id, i) => Entry(id, i % 3 == 0 ? "Present" : i % 3 == 1 ? "Absent" : "Late")).ToList();

        var saved = await _client.PutAsJsonAsync("/api/attendance/2029-01-10", new { entries });
        var day = await _client.GetFromJsonAsync<AttendanceDayDto>("/api/attendance/2029-01-10");

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.True(day!.IsRecorded);
        Assert.Equal(new DateOnly(2029, 1, 10), day.Date);
        Assert.Equal(
            [AttendanceStatus.Present, AttendanceStatus.Absent, AttendanceStatus.Late, AttendanceStatus.Present, AttendanceStatus.Absent, AttendanceStatus.Late],
            day.Entries.Select(e => e.Status));
    }

    [Fact]
    public async Task Day_never_recorded_lists_every_trainee_without_a_status()
    {
        var day = await _client.GetFromJsonAsync<AttendanceDayDto>("/api/attendance/2029-01-11");

        Assert.False(day!.IsRecorded);
        Assert.Equal(["Rado", "Soa", "Nirina", "Toky", "Fenitra", "Mialy"], day.Entries.Select(e => e.TraineeName));
        Assert.All(day.Entries, e => Assert.Null(e.Status));
    }

    [Fact]
    public async Task Saving_a_day_twice_updates_it_without_creating_duplicates()
    {
        var ids = await TraineeIdsAsync();
        await PutAsync("2029-01-12", ids.Select(id => Entry(id, "Present")));

        var second = ids.Select((id, i) => Entry(id, i == 0 ? "Absent" : "Late")).ToList();
        var response = await PutAsync("2029-01-12", second);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var day = await _client.GetFromJsonAsync<AttendanceDayDto>("/api/attendance/2029-01-12");
        Assert.Equal(AttendanceStatus.Absent, day!.Entries[0].Status);
        Assert.All(day.Entries.Skip(1), e => Assert.Equal(AttendanceStatus.Late, e.Status));
        await factory.UseDbAsync(async db =>
            Assert.Equal(6, await db.AttendanceRecords.CountAsync(r => r.Date == new DateOnly(2029, 1, 12))));
    }

    [Fact]
    public async Task Future_date_is_refused_with_a_message_on_the_date()
    {
        var ids = await TraineeIdsAsync();

        var response = await PutAsync("2030-06-16", ids.Select(id => Entry(id, "Present")));

        await AssertValidationErrorAsync(response, "date");
        var day = await _client.GetFromJsonAsync<AttendanceDayDto>("/api/attendance/2030-06-16");
        Assert.False(day!.IsRecorded);
    }

    [Fact]
    public async Task Today_can_be_recorded()
    {
        var ids = await TraineeIdsAsync();

        var response = await PutAsync("2030-06-15", ids.Select(id => Entry(id, "Present")));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Malformed_date_answers_400()
    {
        var ids = await TraineeIdsAsync();

        var response = await PutAsync("15-06-2029", ids.Select(id => Entry(id, "Present")));
        var read = await _client.GetAsync("/api/attendance/not-a-date");

        await AssertValidationErrorAsync(response, "date");
        await AssertValidationErrorAsync(read, "date");
    }

    [Fact]
    public async Task Missing_trainee_is_refused_by_name_and_nothing_is_saved()
    {
        var ids = await TraineeIdsAsync();

        var response = await PutAsync("2029-01-13", ids.Take(4).Select(id => Entry(id, "Present")));

        var messages = await AssertValidationErrorAsync(response, "Entries");
        Assert.Contains(messages, m => m.Contains("Fenitra") && m.Contains("Mialy"));
        var day = await _client.GetFromJsonAsync<AttendanceDayDto>("/api/attendance/2029-01-13");
        Assert.False(day!.IsRecorded);
    }

    [Fact]
    public async Task Trainee_without_a_status_is_refused()
    {
        var ids = await TraineeIdsAsync();
        var entries = ids.Select(id => Entry(id, "Present")).ToList();
        entries[2] = new { traineeId = ids[2], status = (string?)null };

        var response = await PutAsync("2029-01-14", entries);

        var messages = await AssertValidationErrorAsync(response, "Entries");
        Assert.Contains(messages, m => m.Contains("Nirina"));
    }

    [Fact]
    public async Task Unknown_or_repeated_trainee_is_refused()
    {
        var ids = await TraineeIdsAsync();

        var unknown = await PutAsync("2029-01-15", ids.Select(id => Entry(id, "Present")).Append(Entry(999999, "Present")));
        var repeated = await PutAsync("2029-01-15", ids.Select(id => Entry(id, "Present")).Append(Entry(ids[0], "Absent")));

        await AssertValidationErrorAsync(unknown, "Entries");
        await AssertValidationErrorAsync(repeated, "Entries");
    }

    [Fact]
    public async Task Unknown_status_text_answers_400()
    {
        var ids = await TraineeIdsAsync();

        var response = await PutAsync("2029-01-16", ids.Select(id => Entry(id, "Maybe")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Summary_counts_late_days_as_attended()
    {
        var ids = await TraineeIdsAsync();
        await PutAsync("2029-02-01", ids.Select(id => Entry(id, "Late")));

        var summary = await _client.GetFromJsonAsync<List<TraineeSummaryDto>>("/api/attendance/summary?from=2029-02-01&to=2029-02-01");

        Assert.Equal(6, summary!.Count);
        Assert.All(summary, line =>
        {
            Assert.Equal(1, line.LateDays);
            Assert.Equal(0, line.PresentDays);
            Assert.Equal(100.0m, line.AttendanceRate);
        });
    }

    [Fact]
    public async Task Summary_of_a_period_without_records_has_zeros_and_no_rate()
    {
        var summary = await _client.GetFromJsonAsync<List<TraineeSummaryDto>>("/api/attendance/summary?from=2026-01-01&to=2026-01-31");

        Assert.Equal(6, summary!.Count);
        Assert.All(summary, line =>
        {
            Assert.Equal(0, line.RecordedDays);
            Assert.Null(line.AttendanceRate);
        });
    }

    [Fact]
    public async Task Summary_only_counts_the_period_and_gives_each_trainee_their_own_figures()
    {
        var ids = await TraineeIdsAsync();
        // Records the API cannot create (it always saves every trainee): Rado and Soa only.
        await factory.UseDbAsync(async db =>
        {
            db.AttendanceRecords.AddRange(
                Record(ids[0], "2027-05-03", AttendanceStatus.Present),
                Record(ids[0], "2027-05-04", AttendanceStatus.Late),
                Record(ids[0], "2027-05-05", AttendanceStatus.Absent),
                Record(ids[0], "2027-04-30", AttendanceStatus.Present), // before the period
                Record(ids[0], "2027-06-01", AttendanceStatus.Present), // after the period
                Record(ids[1], "2027-05-03", AttendanceStatus.Absent));
            await db.SaveChangesAsync();
        });

        var summary = await _client.GetFromJsonAsync<List<TraineeSummaryDto>>("/api/attendance/summary?from=2027-05-03&to=2027-05-31");

        var rado = summary![0];
        Assert.Equal((1, 1, 1, 3), (rado.PresentDays, rado.LateDays, rado.AbsentDays, rado.RecordedDays));
        Assert.Equal(66.7m, rado.AttendanceRate);
        Assert.Equal(0.0m, summary[1].AttendanceRate); // a real 0 %, not "no data"
        Assert.All(summary.Skip(2), line =>
        {
            Assert.Equal(0, line.RecordedDays);
            Assert.Null(line.AttendanceRate); // never recorded: no misleading 0 %
        });
    }

    [Fact]
    public async Task Summary_with_an_end_date_before_the_start_date_answers_400()
    {
        var response = await _client.GetAsync("/api/attendance/summary?from=2029-03-10&to=2029-03-09");

        await AssertValidationErrorAsync(response, "to");
    }

    [Fact]
    public async Task Summary_accepts_a_single_day_period()
    {
        var response = await _client.GetAsync("/api/attendance/summary?from=2029-03-10&to=2029-03-10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Summary_requires_both_dates()
    {
        var response = await _client.GetAsync("/api/attendance/summary?from=2029-03-10");

        await AssertValidationErrorAsync(response, "to");
    }

    [Fact]
    public async Task Database_rejects_a_duplicate_with_the_error_the_controller_recognises()
    {
        // The controller updates existing rows; this is the safety net for two first saves racing.
        // AttendanceController relies on this exact exception shape (MySQL error 1062).
        var ids = await TraineeIdsAsync();
        await using var first = factory.Services.CreateAsyncScope();
        await using var second = factory.Services.CreateAsyncScope();
        var firstDb = first.ServiceProvider.GetRequiredService<AppDbContext>();
        var secondDb = second.ServiceProvider.GetRequiredService<AppDbContext>();

        firstDb.AttendanceRecords.Add(Record(ids[0], "2027-07-01", AttendanceStatus.Present));
        await firstDb.SaveChangesAsync();
        secondDb.AttendanceRecords.Add(Record(ids[0], "2027-07-01", AttendanceStatus.Absent));

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => secondDb.SaveChangesAsync());
        Assert.True(error.IsDuplicateKey());
        Assert.Equal(1062, Assert.IsType<MySqlException>(error.InnerException).Number);
    }

    [Fact]
    public async Task Trainees_are_listed_in_order()
    {
        var trainees = await _client.GetFromJsonAsync<List<TraineeDto>>("/api/trainees");

        Assert.Equal(["Rado", "Soa", "Nirina", "Toky", "Fenitra", "Mialy"], trainees!.Select(t => t.Name));
    }

    private async Task<List<int>> TraineeIdsAsync() =>
        (await _client.GetFromJsonAsync<List<TraineeDto>>("/api/trainees"))!.Select(t => t.Id).ToList();

    private static object Entry(int traineeId, string status) => new { traineeId, status };

    private Task<HttpResponseMessage> PutAsync(string date, IEnumerable<object> entries) =>
        _client.PutAsJsonAsync($"/api/attendance/{date}", new { entries });

    private static AttendanceRecord Record(int traineeId, string date, AttendanceStatus status) =>
        new() { TraineeId = traineeId, Date = DateOnly.Parse(date), Status = status };

    // Checks the 400 and returns the messages listed under `field` (PascalCase, as the API sends it).
    private static async Task<List<string>> AssertValidationErrorAsync(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(problem.GetProperty("errors").TryGetProperty(field, out var messages), $"No error on {field}.");
        var list = messages.EnumerateArray().Select(m => m.GetString()!).ToList();
        Assert.NotEmpty(list);
        return list;
    }
}
