using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Stripe.Checkout;
using Stripe;
using RideWild.Models.AdventureModels;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RideWild.Services;
using Stripe.Climate;
using RideWild.Interfaces;
using RideWild.Models.DataModels;
using Microsoft.Extensions.Options;
using RideWild.Models;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;
        private readonly AdventureWorksDataContext _contextData;
        private readonly IEmailService _emailService;
        private readonly StripeSettings _stripeSettings;

        public PaymentsController (AdventureWorksLt2019Context context, IEmailService emailService, AdventureWorksDataContext contextData, IOptions<StripeSettings> stripeSettings)
        {
            _context = context;
            _emailService = emailService;
            _contextData = contextData;
            _stripeSettings = stripeSettings.Value;
        }




        // checkout di stripe
        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] long orderId)
        {
            try
            {
                var order = await _context.SalesOrderHeaders
                .Include(o => o.SalesOrderDetails)
                .FirstOrDefaultAsync(o => o.SalesOrderId == orderId);

                if (order == null)
                    return NotFound("Ordine non trovato");

                // linee dei prodotti
                var lineItems = order.SalesOrderDetails.Select(product => new SessionLineItemOptions
                {
                    Quantity = product.OrderQty,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = (long)(product.UnitPrice * 100), // € -> cent
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Prodotto {product.ProductId}",
                        }
                    }
                }).ToList();

                // linea per le tasse
                if (order.TaxAmt > 0)
                {
                    lineItems.Add(new SessionLineItemOptions
                    {
                        Quantity = 1,
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            UnitAmount = (long)(order.TaxAmt * 100),
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = "Tasse"
                            }
                        }
                    });
                }

                // linea per la spedizione
                if (order.Freight > 0)
                {
                    lineItems.Add(new SessionLineItemOptions
                    {
                        Quantity = 1,
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            UnitAmount = (long)(order.Freight * 100),
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"Spedizione ({order.ShipMethod})"
                            }
                        }
                    });
                }

                // CustomerEmail = _authService.GetUserEmail(),
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string>
                    {
                        "card"
                    },
                    LineItems = lineItems,
                    Mode = "payment",
                    SuccessUrl = "http://localhost:4200/success/",
                    CancelUrl = "http://localhost:4200/cart/",
                    ClientReferenceId = orderId.ToString()
                };

                var service = new SessionService();
                var session = service.Create(options);

                // Salva sessionId in ordine
                order.CreditCardApprovalCode = session.Id.Substring(0, 15); // non consigliato, andrebbe aumentato il valore in salesOrderHeader
                await _context.SaveChangesAsync();

                return Ok(new { url = session.Url });
            } catch (Exception ex)
            {
                Log.Error(ex, "Errore nel checkout di Stripe");

                // Ritorna il messaggio per debug (solo in dev)
                return StatusCode(500, new { message = ex.Message, stack = ex.StackTrace });
            }
           
        }

        // webhook di stripe
        [HttpPost("webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            Console.WriteLine(">>> StripeWebhook chiamato");


            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    _stripeSettings.WebhookSecret // chiave segreta webhook
                );

                if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
                {
                    Console.WriteLine("dentro stripeevent");

                    var session = stripeEvent.Data.Object as Session;

                    var order = await _context.SalesOrderHeaders
                        .FirstOrDefaultAsync(o => o.CreditCardApprovalCode == session.Id.Substring(0, 15));

                    if (order != null)
                    {
                        order.Status = 2; // approved
                        await _context.SaveChangesAsync();

                        // INVIO EMAIL
                        var subject = $@"Ridewild - Conferma pagamento – Ordine {order.SalesOrderId}";
                        var emailContent = $@"
                            <h2>Pagamento completato con successo</h2>

                            <p>Ti confermiamo che il pagamento per l'ordine <strong> {order.SalesOrderId}</strong> è andato a buon fine in data <strong>{DateTime.Now:dd/MM/yyyy}</strong>.</p>

                            <p>Riceverai un'altra email non appena l'ordine sarà spedito.</p>

                            <p>Grazie per aver acquistato su <strong>RideWild</strong>!</p>
                        ";
                        var customer = await _contextData.CustomerData.FirstOrDefaultAsync(c => c.Id == order.CustomerId);


                        if (customer != null)
                        {
                            await SendEmail(customer.EmailAddress, subject, emailContent);
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                Console.WriteLine("Errore StripeException: " + ex.Message);
                return BadRequest();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Errore generale: " + ex.Message);
                return BadRequest();
            }
        }



        private async Task<IActionResult> SendEmail(string recipient, string subject, string content)
        {
            await _emailService.SendEmail(recipient, subject, content);

            return Ok();
        }
    }
}
