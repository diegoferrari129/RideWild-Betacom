using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using RideWild.DTO.OrderDTO;
using RideWild.DTO.OrderDTO.OrderDTO;
using RideWild.Interfaces;
using RideWild.Models;
using RideWild.Models.AdventureModels;
using RideWild.Models.DataModels;
using RideWild.Utility;
using Serilog;
using Stripe;
using Stripe.Checkout;
using Stripe.Climate;
using System.Security.Cryptography.Pkcs;


namespace RideWild.Controllers
{
    //test
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;
        private readonly AdventureWorksDataContext _contextData;
        private readonly IEmailService _emailService;


        public OrdersController(AdventureWorksLt2019Context context, IEmailService emailService, AdventureWorksDataContext contextData)
        {
            _context = context;
            _emailService = emailService;
            _contextData = contextData;
        }


        //mostra lista ordini CON PAGINAZIONE
        //USE: ADMIN DASHBOARD
        [Authorize(Policy = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllOrders(int page = 1, int pageSize = 20)
        {
            try
            {
                var totalCount = await _context.SalesOrderHeaders.CountAsync();

                var orders = await _context.SalesOrderHeaders
                    .OrderByDescending(o => o.OrderDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok( new { totalCount, orders });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore interno nel caricamento degli ordini");
                return StatusCode(500, ex.Message);
            }
        }

        // mostra gli ordini per customerId
        // USE: USER DASHBOARD O ADMIN DASHBOARD FILTER
        [Authorize]
        [HttpGet("customer/")]
        public async Task<IActionResult> GetOrdersByCustomer()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");
            try
            {
                var orders = await _context.SalesOrderHeaders
                    .Where(o => o.CustomerId == userId)
                    //.Skip((page - 1) * pageSize)
                    //.Take(pageSize)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore interno nel caricamento degli ordini");
                return StatusCode(500, ex.Message);
            }
        }

        [Authorize(Policy = "Admin")]
        [HttpGet("search/{orderId}")]
        public async Task<ActionResult<SalesOrderHeader>> SearchOrder(int orderId)
        {
            try
            {
                var order = await _context.SalesOrderHeaders.FirstOrDefaultAsync(o => o.SalesOrderId == orderId);

                if (order == null)
                {
                    return NotFound($"Ordine con ID {orderId} non trovato.");
                }

                return order;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore interno nel caricamento dell'ordine nr. " + orderId);
                return StatusCode(500, ex.Message);
            }
        }



        // mostra l'ordine nel dettaglio
        // USE: ADMIN DASHBOARD
        [Authorize]
        [HttpGet("{orderId}")]
        public async Task<ActionResult<SalesOrderHeader>> GetOrder(int orderId)
        {
            try
            {
                var order = await _context.SalesOrderHeaders
                    .Include(o => o.SalesOrderDetails)
                        .ThenInclude(d => d.Product)
                    .Include(o => o.ShipToAddress)
                    .Include(o => o.BillToAddress)
                    .Include(o => o.Customer)
                    .FirstOrDefaultAsync(o => o.SalesOrderId == orderId);

                if (order == null)
                {
                    return NotFound($"Ordine con ID {orderId} non trovato.");
                }

                return order;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore interno nel caricamento dell'ordine nr. " + orderId);
                return StatusCode(500, ex.Message);
            }
        }


        // crea ordine
        // USE: USER E ADMIN DASHBOARD
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<SalesOrderHeader>> CreateOrder(OrderDTO orderDto)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                // creo il sales order header dal dto
                var newOrder = new SalesOrderHeader
                {
                    CustomerId = userId,
                    ShipToAddressId = orderDto.ShipToAddressId, // se non è corretto genera eccezione
                    BillToAddressId = orderDto.BillToAddressId, // se non è corretto genera eccezione
                    OrderDate = orderDto.OrderDate,
                    DueDate = orderDto.OrderDate.AddDays(10), // 10 giorni dall'ordine, poi quando modifico status passa a 5
                    ShipMethod = orderDto.ShipMethod,
                    Comment = orderDto.Comment,
                    OnlineOrderFlag = true,
                    TaxAmt = 0,
                    Freight = orderDto.Freight,
                    CreditCardApprovalCode = "" // varchar(15) Approval code provided by the credit card company.
                };

                // aggiungo l'order details al salesorderheader
                foreach (var OrderDetailDto in orderDto.OrderDetails)
                {
                    newOrder.SalesOrderDetails.Add(new SalesOrderDetail
                    {
                        ProductId = OrderDetailDto.ProductId, // passo dal carrello
                        OrderQty = OrderDetailDto.OrderQty,
                        UnitPrice = OrderDetailDto.UnitPrice,
                        UnitPriceDiscount = OrderDetailDto.UnitPriceDiscount // sconto da appliare al prodotto
                    });
                }

                // Aggiungo l'ordine alla base di dati.
                _context.SalesOrderHeaders.Add(newOrder);

                // Salviamo le modifiche nel database in modo asincrono.
                await _context.SaveChangesAsync();

                // ora hai newOrder aggiornato
                await _context.Entry(newOrder).ReloadAsync();

                // modifica taxamt
                newOrder.TaxAmt = newOrder.SubTotal * 0.22m;

                // Salviamo le modifiche nel database in modo asincrono.
                await _context.SaveChangesAsync();

                // email di conferma ordine
                var subject = $@"Ridewild - Ordine {newOrder.SalesOrderId} - Grazie per l'acquisto!";
                var emailContent = $@"
                    <h2>Grazie per il tuo ordine, {newOrder.CustomerId}!</h2>
                    <p>Ecco il riepilogo del tuo acquisto effettuato il {newOrder.OrderDate:dd/MM/yyyy}:</p>

                    <h3>Dettagli ordine</h3>
                    <ul>
                        <li><strong>Numero ordine:</strong> {newOrder.SalesOrderId}</li>
                        <li><strong>Data:</strong> {newOrder.OrderDate:dd/MM/yyyy}</li>
                        <li><strong>Metodo di pagamento:</strong> Carta di credito</li>
                        <li><strong>Stato:</strong> In elaborazione</li>
                    </ul>
                    <h3>Riepilogo pagamento</h3>
                    <ul>
                        <li><strong>Subtotale:</strong> {newOrder.SubTotal:C}</li>
                        <li><strong>Tasse:</strong> {newOrder.TaxAmt:C}</li>
                        <li><strong>Spedizione:</strong> {newOrder.Freight:C}</li>
                        <li><strong><u>Totale:</u></strong> {newOrder.TotalDue:C}</li>
                    </ul>

                    <p>Riceverai un'email di conferma quando il tuo ordine sarà spedito.</p>

                    <p>Grazie per aver scelto RideWild!</p>
                ";

                var customer = await _contextData.CustomerData.FirstOrDefaultAsync(c => c.Id == newOrder.CustomerId);

                if (customer != null)
                {
                    await SendEmail(customer.EmailAddress, subject, emailContent);
                }

                // Restituiamo una risposta positiva con l'ID dell'ordine appena creato.
                return CreatedAtAction("GetOrder", new { orderId = newOrder.SalesOrderId }, newOrder);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore durante la creazione di un nuovo ordine");
                return StatusCode(500, ex.Message);
            }
        }



        // modifica ordine
        // USE: ADMIN DASHBOARD
        [Authorize(Policy = "Admin")]
        [HttpPut("{orderId}")]
        public async Task<IActionResult> UpdateOrder(int orderId, OrderDTO updateOrderDto)
        {
            try
            {
                // cerca l'ordine tramite id
                var orderToUpdate = await _context.SalesOrderHeaders
                    .Include(o => o.SalesOrderDetails)
                    .FirstOrDefaultAsync(o => o.SalesOrderId == orderId);

                // controlla se esiste
                if (orderToUpdate == null)
                    return NotFound($"Ordine con ID {orderId} non trovato.");

                // aggiorna sales header
                orderToUpdate.OrderDate = updateOrderDto.OrderDate;
                orderToUpdate.ShipMethod = updateOrderDto.ShipMethod;
                orderToUpdate.Comment = updateOrderDto.Comment;
                orderToUpdate.ShipToAddressId = updateOrderDto.ShipToAddressId;
                orderToUpdate.BillToAddressId = updateOrderDto.BillToAddressId;
                orderToUpdate.DueDate = orderToUpdate.OrderDate.AddDays(10); // 10 giorni dall'ordine, poi quando modifico status passa a 5
                orderToUpdate.ShipMethod = updateOrderDto.ShipMethod;
                orderToUpdate.ModifiedDate = DateTime.UtcNow;
                //orderToUpdate.CreditCardApprovalCode = "" // varchar(15) Approval code provided by the credit card company.

                // reset subtotal
                orderToUpdate.SubTotal = 0;
                orderToUpdate.TaxAmt = 0;
                orderToUpdate.Freight = 10;

                // cancella i dettagli precedenti per sovrascrivere completamente
                _context.SalesOrderDetails.RemoveRange(orderToUpdate.SalesOrderDetails);

                // aggiunge i nuovi dettagli
                foreach (var updateOrderDetailDto in updateOrderDto.OrderDetails)
                {
                    orderToUpdate.SalesOrderDetails.Add(new SalesOrderDetail
                    {
                        ProductId = updateOrderDetailDto.ProductId,
                        OrderQty = updateOrderDetailDto.OrderQty,
                        UnitPrice = updateOrderDetailDto.UnitPrice,
                        UnitPriceDiscount = updateOrderDetailDto.UnitPriceDiscount,
                        ModifiedDate = DateTime.UtcNow
                    });
                }

                // Salviamo le modifiche nel database in modo asincrono.
                await _context.SaveChangesAsync();

                // ora hai orderToUpdate aggiornato 1
                await _context.Entry(orderToUpdate).ReloadAsync();

                // modifica taxamt
                orderToUpdate.TaxAmt = orderToUpdate.SubTotal * 0.22m;

                // Salviamo le modifiche nel database in modo asincrono.
                await _context.SaveChangesAsync();

                // Restituiamo una risposta positiva con l'ID dell'ordine appena creato.
                return CreatedAtAction("GetOrder", new { orderId = orderToUpdate.SalesOrderId }, orderToUpdate);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore durante la modifica dell'ordine nr. " + orderId);
                return StatusCode(500, ex.Message);
            }
         
        }


        // modifica stato dell'ordine
        [Authorize(Policy = "Admin")]
        [HttpPatch("status")]
        public async Task<ActionResult<SalesOrderHeader>> PatchOrderStatus([FromBody] UpdateOrderStatusDTO updateOrderStatusDTO)
        {
            try
            {
                var order = await _context.SalesOrderHeaders.FindAsync(updateOrderStatusDTO.OrderId);

                if (order == null)
                {
                    return NotFound($"Ordine con ID {updateOrderStatusDTO.OrderId} non trovato.");
                }

                Console.WriteLine(order.Status);
                Console.WriteLine((byte)updateOrderStatusDTO.Status);


                if (order.Status > (byte)updateOrderStatusDTO.Status)
                {
                    return BadRequest("Non è possibile riportare l'ordine da questo" + order.Status + "a " + (byte)updateOrderStatusDTO.Status);
                }

                order.Status = (byte)updateOrderStatusDTO.Status;

                var customer = await _contextData.CustomerData.FirstOrDefaultAsync(c => c.Id == order.CustomerId);

                switch (updateOrderStatusDTO.Status)
                {
                    case OrderStatus.Rejected: // 4 = Rejected
                        order.Comment = "Ordine rifiutato, contattare il cliente";

                        var subject = "Il tuo ordine è stato rifiutato";
                        var content = $@"
                            <p>Caro cliente,</p>
                            <p>Purtroppo il tuo ordine <strong>#{order.SalesOrderId}</strong> è stato rifiutato.</p>
                            <p>Ti invitiamo a contattarci per ulteriori informazioni o assistenza.</p>";

                        if (customer != null)
                        {
                            await SendEmail(customer.EmailAddress, subject, content);
                        }

                        break;
                    case OrderStatus.Shipped: // 5 = Shipped
                        order.ShipDate = DateTime.UtcNow;
                        order.DueDate = order.ShipDate.Value.AddDays(5); // calcola dueDate con shipDate + 5 giorni

                        subject = "Il tuo ordine è stato spedito!";
                        content = $@"
                            <p>Caro cliente,</p>
                            <p>Siamo felici di informarti che il tuo ordine <strong>#{order.SalesOrderId}</strong> è stato spedito il {order.ShipDate?.ToString("dd/MM/yyyy")}.</p>
                            <p>La consegna è prevista entro il {order.DueDate.ToString("dd/MM/yyyy")}.</p>
                            <p>Grazie per la fiducia!</p>";

                        if (customer != null)
                        {
                            await SendEmail(customer.EmailAddress, subject, content);
                        }

                        break;
                    case OrderStatus.Cancelled: // 6 = Cancelled
                        order.ShipDate = null;
                        order.Comment = "Ordine annullato";

                        subject = "Il tuo ordine è stato annullato";
                        content = $@"
                            <p>Caro cliente,</p>
                            <p>Il tuo ordine <strong>#{order.SalesOrderId}</strong> è stato annullato.</p>
                            <p>Contattaci per ulteriori informazioni o per effettuare un nuovo ordine.</p>";

                        if (customer != null)
                        {
                            await SendEmail(customer.EmailAddress, subject, content);
                        }

                        break;
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction("GetOrder", new { orderId = order.SalesOrderId }, order);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore durante la modifica dello status dell'ordine nr. " + updateOrderStatusDTO.OrderId);
                return StatusCode(500, ex.Message);
            }

        }


        // cancella ordine 
        // USE: ADMIN DASHBOARD
        [Authorize(Policy = "Admin")]
        [HttpDelete("{orderId}")]
        public async Task<IActionResult> DeleteOrder(int orderId)
        {
            try
            {
                var order = await _context.SalesOrderHeaders
                    .Include(o => o.SalesOrderDetails)
                    .FirstOrDefaultAsync(o => o.SalesOrderId == orderId);

                if (order == null)
                    return NotFound();

                // rimuove i sales details
                _context.SalesOrderDetails.RemoveRange(order.SalesOrderDetails);

                // rimuove il sales header
                _context.SalesOrderHeaders.Remove(order);

                await _context.SaveChangesAsync();

                return Ok(new {message = "Ordine cancellato"});
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore durante l'eliminazione dell'ordine nr. " + orderId);
                return StatusCode(500, ex.Message);
            }
        }


        private async Task<IActionResult> SendEmail(string recipient, string subject, string content)
        {
            await _emailService.SendEmail(recipient, subject, content);

            return Ok();
        }

    }
}
