using DeliveryTracker.Api.Data;
using DeliveryTracker.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

builder.Services.AddDbContext<DeliveryContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=deliveries.db";

    options.UseSqlite(connectionString);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DeliveryContext>();
    dbContext.Database.Migrate();
}

app.UseCors("FrontendPolicy");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/api/status", () => Results.Ok(new { status = "ready" }));

app.MapGet("/api/deliveries", async (DeliveryContext db) =>
{
    var deliveries = await db.DailyDeliveries
        .OrderByDescending(d => d.DeliveredOn)
        .Select(d => new DeliveryDto(d.Id, d.DeliveredOn.ToString("yyyy-MM-dd"), d.Count))
        .ToListAsync();

    return Results.Ok(deliveries);
});

app.MapPost("/api/deliveries", async (DeliveryContext db, DeliveryInput input) =>
{
    if (!DateOnly.TryParse(input.Date, CultureInfo.InvariantCulture, out var requestedDate))
    {
        return Results.BadRequest(new { error = "Please provide a valid ISO date (YYYY-MM-DD)." });
    }

    if (input.Count <= 0)
    {
        return Results.BadRequest(new { error = "Count must be a positive number." });
    }

    var maxFuture = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1));
    if (requestedDate > maxFuture)
    {
        return Results.BadRequest(new { error = "Date cannot be more than a month ahead." });
    }

    var existing = await db.DailyDeliveries.SingleOrDefaultAsync(d => d.DeliveredOn == requestedDate);
    if (existing is not null)
    {
        existing.Count = input.Count;
    }
    else
    {
        db.DailyDeliveries.Add(new DailyDelivery
        {
            DeliveredOn = requestedDate,
            Count = input.Count
        });
    }

    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapGet("/api/monthly-summary", async (DeliveryContext db) =>
{
    var summary = await db.DailyDeliveries
        .GroupBy(d => new { d.DeliveredOn.Year, d.DeliveredOn.Month })
        .Select(g => new MonthlySummaryDto(g.Key.Year, g.Key.Month, g.Sum(e => e.Count)))
        .OrderByDescending(m => m.Year)
        .ThenByDescending(m => m.Month)
        .ToListAsync();

    return Results.Ok(summary);
});

app.Run();

internal record DeliveryDto(int Id, string DeliveredOn, int Count);
internal record DeliveryInput(string Date, int Count);
internal record MonthlySummaryDto(int Year, int Month, int TotalBottles);
