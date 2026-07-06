using DeliveryTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DeliveryTracker.Api.Data;

public class DeliveryContext : DbContext
{
    public DeliveryContext(DbContextOptions<DeliveryContext> options) : base(options)
    {
    }

    public DbSet<DailyDelivery> DailyDeliveries => Set<DailyDelivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailyDelivery>()
            .HasIndex(d => d.DeliveredOn)
            .IsUnique();

        base.OnModelCreating(modelBuilder);
    }
}
