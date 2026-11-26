using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

namespace Api.Data;

public static class DbUpdateExceptionExtensions
{
    // MySQL error 1062: duplicate entry for a unique index.
    private const int MySqlDuplicateEntry = 1062;

    // True when MySQL refused the write because of a unique index. The controller upserts first, so this
    // only happens when two requests save the same new day at the same moment.
    public static bool IsDuplicateKey(this DbUpdateException exception) =>
        exception.InnerException is MySqlException { Number: MySqlDuplicateEntry };
}
