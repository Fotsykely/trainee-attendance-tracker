using Api.Data;
using Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/trainees")]
public class TraineesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TraineeDto>>> GetAll(CancellationToken cancellationToken)
    {
        return await db.Trainees
            .OrderBy(t => t.Id)
            .Select(t => new TraineeDto(t.Id, t.Name))
            .ToListAsync(cancellationToken);
    }
}
