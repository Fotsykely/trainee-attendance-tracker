using System.Text.Json.Serialization;

namespace Api.Entities;

// In JSON, the status travels as text ("Late") rather than a number, both in request/response
// bodies and in the OpenAPI documentation. It is stored as text in the database as well.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AttendanceStatus
{
    Present,
    Absent,
    Late,
}
