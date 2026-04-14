using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using RideWild.DTO;
using RideWild.Models.AdventureModels;
using RideWild.Models.MongoModels;

namespace RideWild.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;
        private IMongoCollection<Review> _reviewsCollection;

        public ProductsController(AdventureWorksLt2019Context context, IOptions<ReviewsDbConfig> options)
        {
            _context = context;

            var client = new MongoClient(options.Value.ConnectionString);
            var database = client.GetDatabase(options.Value.DatabaseName);
            _reviewsCollection = database.GetCollection<Review>(options.Value.CollectionName);
        }
        
        // GET: api/Products
        [HttpGet]
        public async Task<IActionResult> GetProducts(int page = 1, int pageSize = 15)
        {
            var products = await _context.Products
                .Include(p => p.ProductCategory)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/Products/Bestseller
        [HttpGet("Bestseller")]
        public async Task<IActionResult> GetBestsellerProducts(int page = 1, int pageSize = 15)
        {
            var bestsellers = await _context.SalesOrderDetails
                .Include(so => so.Product)
                .GroupBy(so => so.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    OrderQty = g.Sum(so => so.OrderQty),
                    ProductName = g.Select(so => so.Product.Name).FirstOrDefault(),
                    ProductImage = g.Select(so => so.Product.ThumbNailPhoto).FirstOrDefault(),
                    ProductPrice = g.Select(so => so.Product.ListPrice).FirstOrDefault(),
                    ProductCategory = g.Select(so => so.Product.ProductCategory.Name).FirstOrDefault(),
                    ProductPhotoBase64 = g.Select(so => so.Product.ThumbNailPhotoBase64).FirstOrDefault(),
                })
                .OrderByDescending(g => g.OrderQty)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return Ok(bestsellers);
        }



        //----------------------------------------------------------------------------------------------------------------------------------------------//
        // GET: api/Products/Categories
        [HttpGet("Categories")]
        public async Task<IActionResult> GetProductCategories()
        {
            var categories = await _context.ProductCategories.ToListAsync();
            return Ok(categories);
        }

        [HttpGet("Models")]
        public async Task<IActionResult> GetProductModels()
        {
            var models = await _context.ProductModels.ToListAsync();

            return Ok(models);
        }

        // GET: api/Products/ByCategory?categoryIds=1&categoryIds=2&page=1&pageSize=5
        // non esistono prodotti per categorie: 2,3, 4
        [HttpGet("ByCategory")]
        public async Task<IActionResult> GetProductsByCategory(
            [FromQuery] int[] categoryIds)
        {
            try
            {
                if (categoryIds == null || !categoryIds.Any())
                    return BadRequest("Deve essere specificata almeno una categoria");


                var categoryIdList = categoryIds.ToList(); // importante

                var products = _context.Products
                    .Include(p => p.ProductCategory)
                    .AsEnumerable() // importante
                    .Where(p => p.ProductCategoryId.HasValue && categoryIdList.Contains(p.ProductCategoryId.Value))
                    .OrderBy(p => p.ProductCategoryId)
                    .ToList();

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        //GET: api/Products/ByOneCategory/5
        //[HttpGet("ByOneCategory/{categoryId}")]
        //public async Task<ActionResult<IEnumerable<Product>>> GetProductsByCategory(
        //    int categoryId,
        //    int page = 1,
        //    int pageSize = 15)
        //{
        //    var products = await _context.Products
        //        .Include(p => p.ProductCategory)
        //        .Where(p => p.ProductCategoryId == categoryId)
        //        .Skip((page - 1) * pageSize)
        //        .Take(pageSize)
        //        .ToListAsync();

        //    return Ok(products);
        //}
        //-----------------------------------------------------------------------------------------------------------------------------------------------//



        // GET: api/Products/OrderedByPrice
        [HttpGet("OrderedByPrice")]
        public async Task<IActionResult> GetProductsByPrice(
            int page = 1,
            int pageSize = 15,
            string sortOrder = "asc")
        {
            IQueryable<Product> query = _context.Products.Include(p => p.ProductCategory);

            // Apply ordering
            query = sortOrder.ToLower() == "desc"
                ? query.OrderByDescending(p => p.ListPrice)
                : query.OrderBy(p => p.ListPrice);

            // Apply pagination
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/Products/OrderedByNewest
        [HttpGet("OrderedByNewest")]
        public async Task<IActionResult> GetProductsNewest(
            int page = 1,
            int pageSize = 15,
            string sortOrder = "asc")


        {
            IQueryable<Product> query = _context.Products.Include(p => p.ProductCategory);

            // Apply ordering
            query = sortOrder.ToLower() == "desc"
                ? query.OrderByDescending(p => p.ModifiedDate)
                : query.OrderBy(p => p.ModifiedDate);

            // Apply pagination
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok( products );
        }

        // GET: api/Products/OrderedByNewestAdmin
        [HttpGet("OrderedByNewestAdmin")]
        public async Task<IActionResult> GetProductsNewestAdmin(
            int page = 1,
            int pageSize = 15)

        {
            try
            {
                var totalCount = await _context.Products.CountAsync();
                // Apply ordering
                var products = await _context.Products
                    .Include(p => p.ProductCategory)
                    .OrderByDescending(p => p.ModifiedDate) // Assuming SellStartDate is the field to determine newest
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new { totalCount, products });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

        }

        // GET: api/ProductCatergory
        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<ProductCategory>>> GetProductCategory()
        //{
        //    return await _context.ProductCategory.Select(static c =>c.Name).ToListAsync();
        //}

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
             
            var productFound = await _context.Products
                .Include(p => p.ProductCategory)
                .Include(p => p.ProductModel)
                .ThenInclude(pm => pm.ProductModelProductDescriptions)
                .ThenInclude(pmpd => pmpd.ProductDescription)
                .FirstOrDefaultAsync(p => p.ProductId == id);



                if (product == null)
            {
                return NotFound();
            }

            return productFound;
        }

        // GET: api/Products/search
        [HttpGet("search/{searchValue}")]
        public async Task<ActionResult<IEnumerable<ProductAndReviews>>> SearchProductByName(string searchValue)
        {
            // controllo che searchValue sia valido
            if (searchValue == "" || searchValue == null)
            {
                return BadRequest("Inserisci un valore di ricerca");
            }

            // cerca
            var products = await _context.Products.Where(p => p.Name.ToUpper().Contains(searchValue.ToUpper())).ToListAsync();

            if (products.Count == 0)
            {
                return NotFound("Nessun risultato di ricerca");
            }

            List<ProductAndReviews> productsList = [];

            // ciclo prodotti e aggiunta recensioni
            foreach (var product in products)
            {
                ProductAndReviews productAndReviews = new();

                productAndReviews.Name = product.Name;
                productAndReviews.Reviews = await _reviewsCollection.Find(review => review.ProductId == product.ProductId).SortByDescending(r => r.Rating).ToListAsync();

                productsList.Add(productAndReviews);
            }

            return Ok(productsList);
        }


        // GET api/products/search?q=...
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductSearchDto>>> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Inserisci un valore di ricerca");

            q = q.Trim();

            var results = await _context.Products
                .Where(p => EF.Functions.Like(p.Name, $"%{q}%"))
                .OrderBy(p => p.Name)
                .Select(p => new ProductSearchDto(
                    p.ProductId,
                    p.Name,
                    p.ListPrice,
                    p.ThumbNailPhotoBase64))
                .Take(20)
                .ToListAsync();

            return results.Count == 0
                ? NotFound("Nessun risultato di ricerca")
                : Ok(results);
        }



        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, ProductDTO productDTO)
        {
            var product = await _context.Products.FindAsync(id);

              if (product == null)
            {
                return NotFound();
            }

            product.Name = productDTO.Name;
            product.ProductNumber = productDTO.ProductNumber;
            product.Color = productDTO.Color;
            product.StandardCost = productDTO.StandardCost;
            product.ListPrice = productDTO.ListPrice;
            product.Size = productDTO.Size;
            product.Weight = productDTO.Weight;
            product.ProductCategoryId = productDTO.ProductCategoryId;
            product.SellStartDate = productDTO.SellStartDate == default ? DateTime.UtcNow : productDTO.SellStartDate;
            product.SellEndDate = null; // Set to null if not provided
            product.ThumbNailPhoto = productDTO.ThumbNailPhoto;
            product.ThumbnailPhotoFileName = productDTO.ThumbnailPhotoFileName;


            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) when (!ProductExists(id))
            {
                return NotFound();
            }

            return NoContent();
        }

        // to make a post the url is /api/products
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(ProductDTO productDTO)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Product product = new Product
            {
                Name = productDTO.Name,
                ProductNumber = productDTO.ProductNumber,
                Color = productDTO.Color,
                StandardCost = productDTO.StandardCost,
                ListPrice = productDTO.ListPrice,
                Size = productDTO.Size,
                Weight = productDTO.Weight,
                ProductModelId = productDTO.ProductModelId,
                ProductCategoryId = productDTO.ProductCategoryId,
                SellStartDate = productDTO.SellStartDate == default ? DateTime.UtcNow : productDTO.SellStartDate,
                SellEndDate = null, // Set to null if not provided,
                ThumbNailPhoto = productDTO.ThumbNailPhoto,
                ThumbnailPhotoFileName = productDTO.ThumbnailPhotoFileName,
            };

            try
            {
                _context.Products.Add(product);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }

            return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
        }


        // DELETE: api/Products/5
        [HttpDelete("{ProductId:int}")]
        public async Task<ActionResult<Product>> DeleteProduct(int ProductId)
        {
            try
            {
                // Check for references in SalesOrderDetail
                bool isReferenced = await _context.SalesOrderDetails.AnyAsync(sod => sod.ProductId == ProductId);
                if (isReferenced)
                {
                    return Conflict($"Cannot delete product {ProductId} because it is referenced by sales orders.");
                }

                var deletedCount = await _context.Products
                    .Where(p => p.ProductId == ProductId)
                    .ExecuteDeleteAsync();

                if (deletedCount == 0)
                {
                    return NotFound($"Product with Id = {ProductId} not found");
                }

                return NoContent();
                //var productToDelete = await _context.Products.FindAsync(ProductId);

                //if (productToDelete == null)
                //{
                //    return NotFound($"Product with Id = {ProductId} not found");
                //}

                //await _context.Products
                //    .Where(p => p.ProductId == ProductId)
                //    .ExecuteDeleteAsync();

                //return Ok();
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, $"Error deleting product {ProductId}");
            }
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductId == id);
        }
    }
}
