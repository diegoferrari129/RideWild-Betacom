public class ProductSearchDto
{
    public int ProductId { get; }
    public string Name { get; }
    public decimal ListPrice { get; }
    public string? ThumbnailUrl { get; }

    public ProductSearchDto(int productId,
                            string name,
                            decimal listPrice,
                            string? thumbnailUrl)
    {
        ProductId = productId;
        Name = name;
        ListPrice = listPrice;
        ThumbnailUrl = thumbnailUrl;
    }
}
