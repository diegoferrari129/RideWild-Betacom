using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using RideWild.DTO;
using RideWild.Models.AdventureModels;
using RideWild.Models.MongoModels;
using RideWild.Utility;
using System.IO;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IMongoCollection<Review> reviewsCollection;
        private readonly AdventureWorksLt2019Context sqlDbContext;

        public ReviewController(IOptions<ReviewsDbConfig> options, AdventureWorksLt2019Context sqlDbContext)
        {
            var client = new MongoClient(options.Value.ConnectionString);
            var database = client.GetDatabase(options.Value.DatabaseName);
            reviewsCollection = database.GetCollection<Review>(options.Value.CollectionName);
            this.sqlDbContext = sqlDbContext;
        }

        [HttpGet("all")]
        public async Task<IEnumerable<Review>> GetAll()
        {
            return await reviewsCollection.Find(_ => true).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewsByProductId(int id)
        {
            try
            {
                var reviews = await reviewsCollection.Find(r => r.ProductId == id).ToListAsync();
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRORE GET ID] {ex.Message}");
                return StatusCode(500, "Errore interno durante il recupero delle recensioni");
            }
        }

        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] Review review)
        {
            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                if (review == null || review.ProductId == null)
                    return BadRequest("Review o ProductId mancanti");


                // Controlla se il customer ha ordinato questo prodotto
                bool hasOrdered = await sqlDbContext.SalesOrderDetails
                    .Join(sqlDbContext.SalesOrderHeaders,
                        detail => detail.SalesOrderId,
                        header => header.SalesOrderId,
                        (detail, header) => new { detail, header })
                    .AnyAsync(x => x.detail.ProductId == review.ProductId && x.header.CustomerId == userId);

                if (!hasOrdered)
                    return StatusCode(403, "Puoi recensire solo prodotti che hai acquistato.");

                // Salvataggio
                review.CustomerId = userId;
                review.CreatedOn = DateTime.Now;
                await reviewsCollection.InsertOneAsync(review);

                return CreatedAtAction(nameof(GetReviewsByProductId), new { id = review.Id }, review);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRORE AddReview] {ex}");
                return StatusCode(500, "Errore interno durante l'invio recensione");
            }
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(string id, [FromBody] ReviewDTO reviewDto)
        {
            var review = await reviewsCollection.Find(r => r.Id == id).FirstOrDefaultAsync();
            if (review == null)
                return NotFound();

            review.Title = reviewDto.Title;
            review.Text = reviewDto.Text;
            review.CreatedOn = DateTime.Now;
            review.Rating = reviewDto.Rating;

            await reviewsCollection.ReplaceOneAsync(r => r.Id == id, review);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(string id)
        {
            var result = await reviewsCollection.DeleteOneAsync(r => r.Id == id);
            return result.DeletedCount == 0 ? NotFound() : Ok("Review eliminata");
        }
    }
}
