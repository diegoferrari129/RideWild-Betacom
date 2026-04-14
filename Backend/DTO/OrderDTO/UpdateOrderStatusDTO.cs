namespace RideWild.DTO.OrderDTO
{
    public class UpdateOrderStatusDTO
    {
        public int OrderId { get; set; }
        public OrderStatus Status { get; set; }
    }

    public enum OrderStatus
    {
        InProcess = 1,
        Approved = 2,
        Backordered = 3,
        Rejected = 4,
        Shipped = 5,
        Cancelled = 6
    }
}
