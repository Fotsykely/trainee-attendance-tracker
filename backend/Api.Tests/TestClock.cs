namespace Api.Tests;

// A clock that tests can set to any local time. Local time equals UTC, so results do not depend
// on the time zone of the machine running the tests.
public sealed class TestClock : TimeProvider
{
    private DateTime _now = new(2030, 6, 15, 10, 0, 0);

    public void SetLocalNow(DateTime localNow) => _now = localNow;

    public override DateTimeOffset GetUtcNow() => new(_now, TimeSpan.Zero);

    public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
}
