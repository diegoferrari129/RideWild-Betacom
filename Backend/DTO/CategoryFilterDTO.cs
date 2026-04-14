namespace RideWild.DTO
{
    public class CategoryFilterDTO
    {
        public List<int> CategoryIds { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 15;
    }
}
