namespace DeliveryTracker.Api.Models;

public class DailyDelivery
{
    public int Id { get; set; }
    public DateOnly DeliveredOn { get; set; }
    public int Count { get; set; }
}
