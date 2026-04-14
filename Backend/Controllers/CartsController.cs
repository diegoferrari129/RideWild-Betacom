
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideWild.DTO;
using RideWild.Models.AdventureModels;
using RideWild.Utility;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;

        public CartsController(AdventureWorksLt2019Context context)
        {
            _context = context;
        }


        // GET: api/Carts/get
        /*
         * recupero il carrello
         * converto l'oggetto in DTO
         * calcolo il prezzo totale
         */
        [Authorize]
        [HttpGet("get")]
        public async Task<ActionResult<Cart>> GetCart()
        {
            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null)
                {
                    return Ok(new
                    {
                        Items = new List<CartItemDTO>(),
                        Total = 0
                    });
                }

                var items = cart.CartItems.Select(ci => new CartItemDTO
                {
                    CartItemId = ci.Id,
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.Product.ListPrice,
                    TotalPrice = ci.Quantity * ci.Product.ListPrice,
                    ProductImage = ci.Product.ThumbNailPhotoBase64
                }).ToList();

                var total = items.Sum(i => i.TotalPrice);

                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il recupero el carrello: {ex.Message}");
            }
        }


        // PUT: api/Carts/5
        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult> UpdateCartItem(UpdateCartItemDTO updateCartItemDTO)
        {
            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null)
                    return NotFound("Carrello non trovato");

                var item = cart.CartItems
                    .FirstOrDefault(ci => ci.Id == updateCartItemDTO.CartItemId);

                if (item == null)
                    return NotFound("Prodotto non trovato");

                if (updateCartItemDTO.Quantity == 0)
                {
                    _context.CartItems.Remove(item);
                    await _context.SaveChangesAsync();
                    return Ok("Prodotto rimosso");
                }

                item.Quantity = updateCartItemDTO.Quantity;
                item.TotalPrice = updateCartItemDTO.Quantity * (int)item.Product.ListPrice;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Carrello aggiornato", success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'aggiornamento del carrello: {ex.Message}");
            }
        }


        // POST: api/Carts/add
        /* 
        * recupero il carrello del cliente o lo crea se non esiste
        * aggiungo un prodotto al carrello
        * calcolo il totale della riga
        */
        [Authorize]
        [HttpPost("add")]
        public async Task<ActionResult<Cart>> AddCartItem(AddCartItemDTO addCartItemDTO)
        {
            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null)
                {
                    cart = new Cart
                    {
                        CustomerId = userId
                    };
                    _context.Carts.Add(cart);
                    await _context.SaveChangesAsync();
                }

                var product = await _context.Products.FindAsync(addCartItemDTO.ProductId);
                if (product == null)
                    return NotFound("Prodotto non trovato");

                var existingItem = cart.CartItems.FirstOrDefault(i => i.ProductId == addCartItemDTO.ProductId);

                if (existingItem != null)
                {
                    existingItem.Quantity += addCartItemDTO.Quantity;
                    existingItem.TotalPrice = existingItem.Quantity * (int)product.ListPrice;
                }
                else
                {
                    var newItem = new CartItem
                    {
                        ProductId = addCartItemDTO.ProductId,
                        Quantity = addCartItemDTO.Quantity,
                        CartId = cart.Id,
                        TotalPrice = addCartItemDTO.Quantity * (int)product.ListPrice
                    };

                    cart.CartItems.Add(newItem);
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCart), new { customerId = cart.CustomerId }, cart);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'aggiunta del prodotto al carrello: {ex.Message}");
            }
        }


        // DELETE: api/Carts/clear/5
        // elimino tutti i prodotti del carrello
        [Authorize]
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart(int customerId)
        {

            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null)
                    return NotFound("Carrello non trovato");

                _context.CartItems.RemoveRange(cart.CartItems);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Carrello svuotato" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante lo svuotamento del carrello: {ex.Message}");
            }
        }


        // DELETE: api/Carts/5
        // elimino un prodotto dal carrello
        [Authorize]
        [HttpDelete("remove/{CartItemId}")]
        public async Task<IActionResult> RemoveCartItem(long CartItemId)
        {
            try
            {
                if (!Helper.TryGetUserId(User, out int userId))
                    return Unauthorized("Utente non autenticato o ID non valido");

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null)
                    return NotFound("Carrello non trovato per questo utente");

                var itemToRemove = cart.CartItems.FirstOrDefault(ci => ci.Id == CartItemId);

                if (itemToRemove == null)
                    return NotFound("Prodotto non trovato nel carrello");

                _context.CartItems.Remove(itemToRemove);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Prodotto rimosso dal carrello" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante la rimozione del prodotto dal carrello: {ex.Message}");
            }
        }
    }
}
