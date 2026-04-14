using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using RideWild.Models.DataModels;
using RideWild.DTO;
using RideWild.Models.AdventureModels;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Configuration.UserSecrets;
using RideWild.Utility;
using System.Net;
using RideWild.Interfaces;
using Microsoft.IdentityModel.Tokens;
using RideWild.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using RideWild.Services;
using Serilog;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;
        private readonly AdventureWorksDataContext _contextData;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IAuthService _authService;
        private readonly JwtSettings _jwtSettings;
        private readonly string AngularUrl;
        private readonly string AngularPort;

        public CustomersController(JwtSettings jwtsettings,
            AdventureWorksLt2019Context context, 
            AdventureWorksDataContext contextData, 
            IConfiguration configuration, 
            IEmailService emailService,
            IAuthService authService)
        {
            _jwtSettings = jwtsettings;
            _context = context;
            _contextData = contextData;
            _configuration = configuration;
            _emailService = emailService;
            _authService = authService;
            AngularUrl = _configuration["AngularSettings:Url"] ?? "";
            AngularPort = _configuration["AngularSettings:Port"] ?? "";
        }

        /*
         * POST: api/customers/address
         * Insert a new address for a customer that use the API
         */
        [Authorize]
        [HttpPost("address")]
        public async Task<ActionResult<Address>> AddNewAddress(AddressDTO addressDTO)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                Address address = new Address
                {
                    AddressLine1 = addressDTO.AddressLine1,
                    AddressLine2 = addressDTO.AddressLine2,
                    City = addressDTO.City,
                    StateProvince = addressDTO.StateProvince,
                    CountryRegion = addressDTO.CountryRegion,
                    PostalCode = addressDTO.PostalCode
                };
                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                CustomerAddress customerAddress = new CustomerAddress
                {
                    CustomerId = userId,
                    AddressId = address.AddressId,
                    AddressType = addressDTO.AddressType,
                };
                _context.CustomerAddresses.Add(customerAddress);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                AddressDTO response = new AddressDTO
                {
                    AddressId = address.AddressId,
                    AddressLine1 = address.AddressLine1,
                    AddressLine2 = address.AddressLine2,
                    City = address.City,
                    StateProvince = address.StateProvince,
                    CountryRegion = address.CountryRegion,
                    PostalCode = address.PostalCode,
                    AddressType = customerAddress.AddressType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Log.Error(ex, "[AddNewAddress] Errore interno durante l'aggiunta di un nuovo indirizzo");
                return StatusCode(500, "Errore durante la creazione dell'indirizzo. Nessuna modifica è stata salvata.");
            }
        }

        /*
         * GET: api/customers/address
         * Get the addresses of the customer that use the API
         */
        [Authorize]
        [HttpGet("address")]
        public async Task<ActionResult<List<AddressDTO>>> GetAddresses()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var addresses = await _context.CustomerAddresses
                    .Where(ca => ca.CustomerId == userId)
                    .Include(ca => ca.Address)
                    .Select(ca => new AddressDTO
                    {
                        AddressId = ca.AddressId,
                        AddressLine1 = ca.Address.AddressLine1,
                        AddressLine2 = ca.Address.AddressLine2,
                        City = ca.Address.City,
                        StateProvince = ca.Address.StateProvince,
                        CountryRegion = ca.Address.CountryRegion,
                        PostalCode = ca.Address.PostalCode,
                        AddressType = ca.AddressType
                    })
                    .ToListAsync();

                return Ok(addresses);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAddresses] Errore interno durante l'estrazione dell'indirizzo");
                return StatusCode(500, "Errore interno durante il recupero degli indirizzi");
            }
        }

        /*
         * PUT: api/customers/address
         * Change the address with addressId=id of the customer that use the API
         */
        [Authorize]
        [HttpPut("address")]
        public async Task<IActionResult> ModifyAddress(AddressDTO addressDTO)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customerAddress = await _context.CustomerAddresses
                    .Include(ca => ca.Address)
                    .FirstOrDefaultAsync(ca => ca.CustomerId == userId && ca.AddressId == addressDTO.AddressId);

                if (customerAddress == null)
                    return NotFound("Indirizzo non trovato o non autorizzato");

                customerAddress.Address.AddressLine1 = addressDTO.AddressLine1;
                customerAddress.Address.AddressLine2 = addressDTO.AddressLine2;
                customerAddress.Address.City = addressDTO.City;
                customerAddress.Address.StateProvince = addressDTO.StateProvince;
                customerAddress.Address.CountryRegion = addressDTO.CountryRegion;
                customerAddress.Address.PostalCode = addressDTO.PostalCode;

                await _context.SaveChangesAsync();

                AddressDTO response = new AddressDTO
                {
                    AddressId = customerAddress.AddressId,
                    AddressLine1 = customerAddress.Address.AddressLine1,
                    AddressLine2 = customerAddress.Address.AddressLine2,
                    City = customerAddress.Address.City,
                    StateProvince = customerAddress.Address.StateProvince,
                    CountryRegion = customerAddress.Address.CountryRegion,
                    PostalCode = customerAddress.Address.PostalCode,
                    AddressType = customerAddress.AddressType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ModifyAddress] Errore interno durante la modifica dell'indirizzo");
                return StatusCode(500, "Errore interno durante la modifica dell'indirizzo");
            }
        }

        /*
         * DELETE: api/customers/address/id
         * Delete the address with addressId=id of the customer that use the API
         */
        [Authorize]
        [HttpDelete("address/{id}")]
        public async Task<IActionResult> DeleteAddressById(int id)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customerAddress = await _context.CustomerAddresses
                    .Include(ca => ca.Address)
                    .FirstOrDefaultAsync(ca => ca.CustomerId == userId && ca.AddressId == id);

                if (customerAddress == null)
                    return NotFound("Indirizzo non trovato o non autorizzato");

                _context.CustomerAddresses.Remove(customerAddress);
                _context.Addresses.Remove(customerAddress.Address);

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DeleteAddressById] Errore interno durante l'eliminazione dell'indirizzo");
                return StatusCode(500, "Errore interno durante l'eliminazione dell'indirizzo");
            }
        }

        /*
         * GET: api/customers
         * Get the personal information of the customer using the API
         */
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<CustomerDTO>> GetPersonalInfo()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customer = await _context.Customers
                    .Where(c => c.CustomerId == userId)
                    .FirstOrDefaultAsync();

                if (customer == null)
                    return NotFound("Account non esiste");

                var customerDTO = new CustomerDTO
                {
                    NameStyle = customer.NameStyle,
                    Title = customer.Title,
                    FirstName = customer.FirstName,
                    MiddleName = customer.MiddleName,
                    LastName = customer.LastName,
                    Suffix = customer.Suffix,
                    CompanyName = customer.CompanyName,
                    SalesPerson = customer.SalesPerson,
                };

                return Ok(customerDTO);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetPersonalInfo] Errore interno durante l'estrazione delle informazioni del customer");
                return StatusCode(500, " Errore interno durante l'estrazione delle informazioni del customer");
            }
        }

        /*
        * PUT: api/customers
        * Change the personal information of the customer that use the API
        */
        [Authorize]
        [HttpPut]
        public async Task<IActionResult> ModifyPersonalInfo(CustomerDTO customerDto)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customer = await _context.Customers.FindAsync(userId);

                if (customer == null)
                    return NotFound("Cliente non trovato");

                customer.FirstName = customerDto.FirstName;
                customer.LastName = customerDto.LastName;
                customer.MiddleName = customerDto.MiddleName;
                customer.Title = customerDto.Title;
                customer.Suffix = customerDto.Suffix;
                customer.CompanyName = customerDto.CompanyName;
                customer.SalesPerson = customerDto.SalesPerson;
                customer.NameStyle = customerDto.NameStyle;

                await _context.SaveChangesAsync();

                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ModifyPersonalInfo] Errore interno durante la modifica delle informazioni del customer");
                return StatusCode(500, "Errore interno durante la modifica delle informazioni del customer");
            }
        }

        /*
         * PUT: api/customers/change-email-mfa
         * Change the email and MFA settings of the customer that use the API
         */
        [Authorize]
        [HttpPut("change-email-mfa")]
        public async Task<IActionResult> EmailAndMfa(MfaDTO mfa)
        {
            string text = string.Empty;
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customer = await _contextData.CustomerData
                .FirstOrDefaultAsync(ca => ca.Id == userId);
                if (customer == null)
                    return NotFound("Cliente non trovato");

                if (customer.EmailAddress == mfa.EmailAddress && customer.IsEmailConfirmed)
                {
                    customer.IsMfaEnabled = mfa.IsMfaEnabled;
                    text = "Mfa aggiornato";
                }
                else if (customer.EmailAddress != mfa.EmailAddress)
                {
                    if (await _authService.CheckEmailExistsAsync(mfa.EmailAddress))
                        return BadRequest("Email già in uso");

                    customer.EmailAddress = mfa.EmailAddress;
                    customer.IsEmailConfirmed = false;
                    customer.IsMfaEnabled = false;

                    text = "Email aggiornata, conferma l'email per abilitare la Mfa";
                }
                else
                {
                    return BadRequest("Email non valida o già confermata");
                }

                await _contextData.SaveChangesAsync();

                return Ok(new { message = text });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[EmailAndMfa] Errore interno durante la modifica di email e MFA");
                return StatusCode(500, "Errore interno durante la modifica di email e MFA");
            }
            
        }

        /*
         * POST api/customers/check-mfa
         * Check if the MFA is correct and not expires
         */
        [Authorize]
        [HttpPost("check-mfa")]
        public async Task<IActionResult> CheckMfa(CheckMfaDTO checkMfaDTO)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customerData = await _contextData.CustomerData
                .FirstOrDefaultAsync(c => c.Id == userId);

                if (customerData == null)
                    return NotFound("Utente non trovato");

                if (customerData.MfaCodeExpiresAt < DateTime.UtcNow)
                    return BadRequest("Codice MFA scaduto");

                if (checkMfaDTO.MfaCode != customerData.MfaCode)
                    return BadRequest("Codice MFA errato");

                var token = _authService.GenerateJwtToken(customerData, true);

                return Ok(new { message = "Login effettuato con successo", token = token });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CheckMfa] Errore nel controllo del codice MFA");
                return StatusCode(500, "Errore nel controllo del codice MFA");
            }   
        }

        /*
         * GET api/customers/get-security-info
         * Get the email information of the customer that use the API
         */
        [Authorize]
        [HttpGet("get-security-info")]
        public async Task<ActionResult<CustomerEmailDTO>> GetSecurityInfo()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customer = await _contextData.CustomerData
                .Where(c => c.Id == userId)
                .FirstOrDefaultAsync();
                if (customer == null)
                {
                    return NotFound("Account non esiste");
                }
                var customerEmailDTO = new CustomerEmailDTO
                {
                    EmailAddress = customer.EmailAddress,
                    IsEmailConfirmed = customer.IsEmailConfirmed,
                    PhoneNumber = customer.PhoneNumber,
                    IsMfaEnabled = customer.IsMfaEnabled
                };
                return Ok(customerEmailDTO);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetSecurityInfo] Errore nel recupero delle informazioni di sicurezza");
                return StatusCode(500, "Errore nel recupero delle informazioni di sicurezza");
            }
            
        }

        /*
         * PUT: api/customers/modify-password
         * Change the password of the customer that use the API
         */
        [Authorize]
        [HttpPut("modify-password")]
        public async Task<IActionResult> ModifyPsw(UpdatePswDTO modifyPswDTO)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var customer = await _contextData.CustomerData
                .FirstOrDefaultAsync(ca => ca.Id == userId);
                if (customer == null)
                    return NotFound("Cliente non trovato");

                if (!SecurityLib.PasswordUtility.VerifyPassword(modifyPswDTO.OldPassword, customer.PasswordHash, customer.PasswordSalt))
                {
                    return BadRequest("La password attuale non è corretta");
                }
                var newPsw = SecurityLib.PasswordUtility.HashPassword(modifyPswDTO.NewPassword);
                customer.PasswordHash = newPsw.Hash;
                customer.PasswordSalt = newPsw.Salt;
                customer.LastPasswordChange = DateTime.UtcNow;
                var mfa = customer.IsMfaEnabled;
                var newJwt = _authService.GenerateJwtToken(customer, mfa);
                await _contextData.SaveChangesAsync();

                var jwt = _authService.GenerateJwtTokenResetPwd(customer.EmailAddress);
                var resetLink = $"{AngularUrl}{AngularPort}/reset-password?token={jwt}";
                var subject = "ATTENZIONE MODIFICA PASSWORD";
                var emailContent = $@"
                        <p>La password è appena stata modificata, se non sei stato tu</p>
                        <p>clicca sul link sottostante per reimpostare la password:</p>
                        <p><a href=""{resetLink}"">{resetLink}</a></p>";
                await _emailService.SendEmail(customer.EmailAddress, subject, emailContent);

                return Ok(new { message = "Password modificata con successo", token = newJwt });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ModifyPsw] Errore nella modifica della password");
                return StatusCode(500, "Errore nella modifica della password");
            }
            
        }

        /*
         * GET: api/customers/confirm-email-request
         * Send email to confirm the email of the customer that use the API
         */
        [Authorize]
        [HttpGet("confirm-email-request")]
        public async Task<IActionResult> SendRequestConfirmEmail()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");
            try
            {
                var customer = await _contextData.CustomerData
                .FirstOrDefaultAsync(ca => ca.Id == userId);
                if (customer == null)
                    return NotFound("Cliente non trovato");
                if (customer.IsEmailConfirmed)
                    return BadRequest("L'email è già stata confermata");

                var jwt = _authService.GenerateJwtTokenConfirmEmail(customer.EmailAddress);
                var confirmLink = $"{AngularUrl}{AngularPort}/confirm-email?token={jwt}";
                var subject = "Conferma Email";
                var emailContent = $@"
                        <p>Per favore, conferma il tuo indirizzo email cliccando sul link sottostante:</p>
                        <p><a href=""{confirmLink}"">{confirmLink}</a></p>";
                var request = await _emailService.SendEmail(customer.EmailAddress, subject, emailContent);
                return Ok(new { message = "Email di conferma inviata" });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SendRequestConfirmEmail] Errore nella richiesta della conferma email");
                return StatusCode(500, "Errore nella richiesta della conferma email");
            }
            
        }

        /*
         * POST: api/customers/confirm-email
         * Confirm the email of the customer that use the API
         */
        [Authorize]
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(TokenDto tokenDto)
        {

            var handler = new JwtSecurityTokenHandler();
            var secretKey = _jwtSettings.SecretKey;
            var key = Encoding.ASCII.GetBytes(secretKey);

            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            try
            {

                var principal = handler.ValidateToken(tokenDto.Token, parameters, out _);

                var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
                if (tokenType != "email_confirmation")
                    return Unauthorized("Token non valido");

                var userEmail = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _contextData.CustomerData
                    .FirstOrDefaultAsync(c => c.EmailAddress == userEmail);

                if (user == null)
                    return Unauthorized("Utente non trovato");

                Console.WriteLine(user.EmailAddress);

                user.IsEmailConfirmed = true;

                await _contextData.SaveChangesAsync();

                return Ok(new { message = "Email confermata con successo"});
            }
            catch(Exception ex)
            {
                Log.Error(ex, "[ConfirmEmail] Errore nella conferma email");
                return StatusCode(500, "Errore nella conferma email");
            }
        }

    }
}
