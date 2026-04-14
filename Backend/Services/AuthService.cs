using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using NuGet.Common;
using RideWild.DTO;
using RideWild.Interfaces;
using RideWild.Models;
using RideWild.Models.AdventureModels;
using RideWild.Models.DataModels;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Net.Http;
using System.Threading.Tasks;
using Serilog;

namespace RideWild.Services
{
    public class AuthService : IAuthService
    {

        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly AdventureWorksLt2019Context _context;
        private readonly AdventureWorksDataContext _contextData;
        private JwtSettings _jwtSettings;
        private readonly string AngularUrl;
        private readonly string AngularPort;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(JwtSettings jwtsettings, AdventureWorksLt2019Context context, AdventureWorksDataContext contextData, 
            IConfiguration configuration, IEmailService emailService, IHttpContextAccessor httpContextAccessor)
        {
            _configuration = configuration;
            _context = context;
            _contextData = contextData;
            _emailService = emailService;
            _jwtSettings = jwtsettings;
            _httpContextAccessor = httpContextAccessor;
            AngularUrl = _configuration["AngularSettings:Url"] ?? "";
            AngularPort = _configuration["AngularSettings:Port"] ?? "";
        }

        public async Task<AuthResult> Login(LoginDTO loginDTO)
        {
            try
            {
                string email = loginDTO.Email;
                string password = loginDTO.Password;

                var customer = await _contextData.CustomerData
                    .Where(c => c.EmailAddress == email)
                    .FirstOrDefaultAsync();

                if (customer != null)
                {
                    var isValid = SecurityLib.PasswordUtility.VerifyPassword(password, customer.PasswordHash, customer.PasswordSalt);
                    if (isValid)
                    {
                        string jwt = GenerateJwtToken(customer);
                        string refreshToken = GenerateRefreshToken();

                        customer.RefreshToken = refreshToken;
                        customer.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
                        await _contextData.SaveChangesAsync();

                        if (customer.IsMfaEnabled)
                        {
                            var mfaCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
                            customer.MfaCode = mfaCode;
                            customer.MfaCodeExpiresAt = DateTime.UtcNow.AddMinutes(5);
                            await _contextData.SaveChangesAsync();
                            var mfaSubject = "CODICE MFA per l'accesso a RideWild";
                            var mfaContent = $@"
                            <p>Il tuo codice MFA è: {mfaCode}</p>
                            <p>Il codice scadrà tra 5 minuti.</p>";
                            var sendMFA = await _emailService.SendEmail(email, mfaSubject, mfaContent);
                            if (!sendMFA)
                                return AuthResult.FailureAuth("Codice MFA non inviato. Errore server SMTP");
                            return AuthResult.SuccessAuth(jwt, refreshToken, customer.IsMfaEnabled);
                        }
                        await SendLoginAlertEmail(email);
                        return AuthResult.SuccessAuth(jwt, refreshToken);
                    }
                    else
                    {
                        return AuthResult.FailureAuth("Password non corretta");
                    }
                }
                else
                {
                    var oldCustumer = await _context.Customers
                        .Where(c => c.EmailAddress == email)
                        .FirstOrDefaultAsync();

                    if (oldCustumer == null)
                    {
                        var AuthUser = await _contextData.AuthUsers
                            .Where(c => c.EmaiAddress == email)
                            .Include(c => c.Role)
                            .FirstOrDefaultAsync();
                        if (AuthUser == null)
                        {
                            return AuthResult.FailureAuth("Non risultano account associati a questa email");
                        }
                        else
                        {
                            var isValid = SecurityLib.PasswordUtility.VerifyPassword(password, AuthUser.PasswordHash, AuthUser.PasswordSalt);
                            if (isValid)
                            {
                                string jwt = GenerateAdminJwtToken(AuthUser.Id.ToString(), AuthUser.Role.Name);
                                return AuthResult.SuccessAuth(jwt, "");
                            }
                            else
                            {
                                return AuthResult.FailureAuth("Password non corretta");
                            }
                        }

                    }
                    else
                    {
                        var jwt = GenerateJwtTokenResetPwd(email);
                        var resetLink = $"{AngularUrl}{AngularPort}/reset-password?token={jwt}";
                        var subject = "AGGIORNAMENTO SISTEMA RIDEWILD";
                        var emailContent = $@"
                        <p>E' necessario cambiare la password per migrare l'account al nuovo sistema Ridewild.</p>
                        <p>Clicca sul link sottostante per reimpostare la password:</p>
                        <p><a href=""{resetLink}"">{resetLink}</a></p>";
                        var sendUpdate = await _emailService.SendEmail(email, subject, emailContent);
                        if (!sendUpdate)
                            return AuthResult.FailureAuth("Aggiornamento account fallito, riprovare più tardi");

                        return AuthResult.FailureAuth($"L'email è registrata nel sistema vecchio, controlla la tua email per aggiornare il tuo account.");
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore interno, riprova più tardi.");
                return AuthResult.FailureAuth($"Errore interno, riprova più tardi.");
            }
            
        } 
        public async Task<AuthResult> Register(RegisterDTO newCustomerDTO)
        {

            if (await CheckEmailExistsAsync(newCustomerDTO.EmailAddress))
                return AuthResult.FailureAuth("Esiste già un account associato a questa email");

            var psw = SecurityLib.PasswordUtility.HashPassword(newCustomerDTO.Password);

            var newCustomer = new Customer
            {
                FirstName = newCustomerDTO.FirstName,
                LastName = newCustomerDTO.LastName,
                EmailAddress = "",
                Phone = "",
                PasswordHash = "", 
                PasswordSalt = ""
            };

            try
            {
                _context.Customers.Add(newCustomer);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Errore durante la creazione dell'utente");
                return AuthResult.FailureAuth($"Errore durante la creazione dell'utente");
            }

            var customerData = new CustomerData
            {
                Id = newCustomer.CustomerId,
                EmailAddress = newCustomerDTO.EmailAddress,
                PasswordHash = psw.Hash,
                PasswordSalt = psw.Salt,
                PhoneNumber = newCustomerDTO.Phone,
                RefreshToken = GenerateRefreshToken(),
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7),
                LastPasswordChange = DateTime.UtcNow
            };

            try
            {
                _contextData.CustomerData.Add(customerData);
                await _contextData.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                try
                {
                    _context.Customers.Remove(newCustomer);
                    await _context.SaveChangesAsync();
                }
                catch (Exception rollbackEx)
                {
                    Log.Error($"[ERRORE CRITICO] Rollback fallito per CustomerId {newCustomer.CustomerId}: {rollbackEx.Message}");
                    Log.Error($"Stack trace: {rollbackEx.StackTrace}");
                }
                Log.Error(ex, "Errore durante il salvataggio delle credenziali");
                return AuthResult.FailureAuth($"Errore durante il salvataggio delle credenziali, {ex.Message}");
            }

            return AuthResult.SuccessOperation();
        } 
        public async Task<AuthResult> RefreshToken(RefreshTokenDTO refreshTokenDTO)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenDTO.RefreshToken))
                return AuthResult.FailureAuth("Refresh token mancante o non valido");
            try
            {
                var user = await _contextData.CustomerData
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshTokenDTO.RefreshToken);

                if (user == null || user.RefreshTokenExpiresAt < DateTime.UtcNow)
                    return AuthResult.FailureAuth("Token non valido");

                var newAccessToken = GenerateJwtToken(user, user.IsMfaEnabled);
                var newRefreshToken = GenerateRefreshToken();

                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);

                await _contextData.SaveChangesAsync();

                return AuthResult.SuccessAuth(newAccessToken, newRefreshToken);
            }
            catch(Exception ex)
            {
                Log.Error(ex, "[RefreshToken] Errore interno durante l'aggiornamento del token");
                return AuthResult.FailureAuth("Errore interno durante l'aggiornamento del token");
            }
        }
        public async Task<AuthResult> Logout(RefreshTokenDTO refreshTokenDTO)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenDTO.RefreshToken))
                return AuthResult.FailureAuth("Refresh token mancante o non valido");
            try
            {
                var user = await _contextData.CustomerData
                    .FirstOrDefaultAsync(c => c.RefreshToken == refreshTokenDTO.RefreshToken);

                if (user == null)
                    return AuthResult.FailureAuth("Token non valido");

                user.RefreshToken = "";
                user.RefreshTokenExpiresAt = DateTime.UtcNow.AddMinutes(-5);
                await _contextData.SaveChangesAsync();

                return AuthResult.SuccessOperation();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[Logout] Errore interno durante il logout");
                return AuthResult.FailureAuth($"Errore interno durante il logout");
            }
            
        }
        public async Task<AuthResult> ResetPassword(ResetPasswordDTO resetPasswordDTO)
        {
            if (string.IsNullOrWhiteSpace(resetPasswordDTO.Token))
                return AuthResult.FailureAuth("Token non valido");

            var secretKey = _jwtSettings.SecretKey;
            var handler = new JwtSecurityTokenHandler();
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
                var principal = handler.ValidateToken(resetPasswordDTO.Token, parameters, out _);

                var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
                if (tokenType != "password_reset")
                    return AuthResult.FailureAuth("Token non valido");

                var userEmail = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

                if (string.IsNullOrWhiteSpace(userEmail))
                {
                    return AuthResult.FailureAuth("Email mancante nel token");
                }

                var psw = SecurityLib.PasswordUtility.HashPassword(resetPasswordDTO.NewPassword);

                var user = await _context.Customers
                    .FirstOrDefaultAsync(c => c.EmailAddress == userEmail);

                if (user == null)
                {
                    var userNew = await _contextData.CustomerData
                        .FirstOrDefaultAsync(c => c.EmailAddress == userEmail);
                    if(userNew == null)
                        return AuthResult.FailureAuth("Reset password non riuscito, utente non trovato");
                    else
                    {
                        string refreshTokenNew = GenerateRefreshToken();
                        userNew.PasswordHash = psw.Hash;
                        userNew.PasswordSalt = psw.Salt;
                        userNew.RefreshToken = refreshTokenNew;
                        userNew.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
                        userNew.LastPasswordChange = DateTime.UtcNow;

                        await _contextData.SaveChangesAsync();
                        return AuthResult.SuccessOperation();
                    }
                }
                else
                {
                    string refreshToken = GenerateRefreshToken();
                    var customerData = new CustomerData
                    {
                        Id = user.CustomerId,
                        EmailAddress = userEmail,
                        PasswordHash = psw.Hash,
                        PasswordSalt = psw.Salt,
                        PhoneNumber = user.Phone ?? string.Empty,
                        RefreshToken = refreshToken,
                        RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7),
                        LastPasswordChange = DateTime.UtcNow,
                    };
                    _contextData.CustomerData.Add(customerData);
                    await _contextData.SaveChangesAsync();

                    user.PasswordHash = "";
                    user.PasswordSalt = "";
                    user.EmailAddress = "";
                    user.Phone = "";
                    user.ModifiedDate = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    return AuthResult.SuccessOperation();
                }                
            }
            catch
            {
                return AuthResult.FailureAuth("Token scaduto o non valido");
            }
        }
        public async Task<AuthResult> SendEmailRecoveryPassword(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return AuthResult.FailureAuth("Email non valida");
            try
            {
                var customer = await _contextData.CustomerData
                    .Where(c => c.EmailAddress == email)
                    .FirstOrDefaultAsync();
                if (customer == null)
                {
                    return AuthResult.FailureAuth("Nessun account è associato a questa email");
                }
                else
                {
                    var jwt = GenerateJwtTokenResetPwd(email);
                    var resetLink = $"{AngularUrl}{AngularPort}/update-password?token={jwt}";
                    var subject = "Reimposta la tua password";
                    var emailContent = $@"
                    <p>Clicca sul link sottostante per reimpostare la password:</p>
                    <p><a href=""{resetLink}"">{resetLink}</a></p>";
                    var sendReset = await _emailService.SendEmail(email, subject, emailContent);
                    if(!sendReset)
                        return AuthResult.FailureAuth("Reset password via email fallito");
                    return AuthResult.SuccessOperation();
                }
            }
            catch
            {
                return AuthResult.FailureAuth("Token scaduto o non valido");
            }
            
        }
        public async Task<AuthResult> RecoveryPassword(ResetPasswordDTO resetPassword)
        {
            var secretKey = _jwtSettings.SecretKey;
            var handler = new JwtSecurityTokenHandler();
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
                var principal = handler.ValidateToken(resetPassword.Token, parameters, out _);

                var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
                if (tokenType != "password_reset")
                    return AuthResult.FailureAuth("Token non valido");

                var userEmail = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _contextData.CustomerData
                    .FirstOrDefaultAsync(c => c.EmailAddress == userEmail);

                if (user == null)
                    return AuthResult.FailureAuth("Utente non trovato");

                var psw = SecurityLib.PasswordUtility.HashPassword(resetPassword.NewPassword);

                string refreshToken = GenerateRefreshToken();

                user.PasswordHash = psw.Hash;
                user.PasswordSalt = psw.Salt;
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
                user.LastPasswordChange = DateTime.UtcNow;

                await _contextData.SaveChangesAsync();

                return AuthResult.SuccessOperation();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[RecoveryPassword] Errore interno durante il recupero password");
                return AuthResult.FailureAuth("Errore interno durante il recupero password");
            }
        }
        public string GenerateJwtToken(CustomerData customer, bool mfaConfirmed=false)
        {
           
            var handler = new JwtSecurityTokenHandler();
            var secretKey = _jwtSettings.SecretKey;
            var key = Encoding.ASCII.GetBytes(secretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
                    new Claim("lastPasswordChange", (customer.LastPasswordChange ?? DateTime.MinValue.ToUniversalTime()).ToString("o")),
                    new Claim("mfaEnable", customer.IsMfaEnabled.ToString()),
                    new Claim("mfaConfirmed", mfaConfirmed.ToString())

                }),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = handler.CreateToken(tokenDescriptor);
            var jwt = handler.WriteToken(token);

            return jwt;
        }
        private string GenerateAdminJwtToken(string id, string role)
        {
            var secretKey = _jwtSettings.SecretKey;
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(secretKey);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, id),
                    new Claim(ClaimTypes.Role, role)
                }),
                Expires = DateTime.Now.AddMinutes(_jwtSettings.ExpirationMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return jwt;
        }  
        public string GenerateJwtTokenResetPwd(string email)
        {
            var secretKey = _jwtSettings.SecretKey;
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("token_type", "password_reset"),
                new Claim(ClaimTypes.Email, email)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }

        public string GenerateJwtTokenConfirmEmail(string email)
        {
            var secretKey = _jwtSettings.SecretKey;
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim("token_type", "email_confirmation"),
                new Claim(ClaimTypes.Email, email)
            };
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: creds
            );
            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
        private string GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }
        public async Task<bool> CheckEmailExistsAsync(string email)
        {
            try
            {
                return await _contextData.CustomerData.AnyAsync(e => e.EmailAddress == email)
                    || await _context.Customers.AnyAsync(e => e.EmailAddress == email);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CheckEmailExistsAsync] Errore interno durante il controllo dell'esistenza della email");
                return false; 
            }
        }
        private async Task<(string city, string country)> GetLocationFromIp(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip))
                return ("", "");

            using var httpClient = new HttpClient();

            try
            {
                var response = await httpClient.GetStringAsync($"http://ip-api.com/json/{ip}");
                var json = JsonConvert.DeserializeObject<GeoLocationResult>(response);

                if (json == null)
                    return ("", "");

                return (json.City ?? "", json.Country ?? "");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetLocationFromIp] Errore interno durante la geolocalizzazione dell'ip");
                return ("", "");
            }
        }
        private async Task SendLoginAlertEmail(string email)
        {
            var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
            var ipAddress = string.IsNullOrWhiteSpace(ip) ? "IP sconosciuto" : ip;

            string city = "Sconosciuta";
            string country = "Sconosciuto";

            if (!string.IsNullOrWhiteSpace(ip))
            {
                (city, country) = await GetLocationFromIp(ip);
            }

            var jwtNew = GenerateJwtTokenResetPwd(email);
            var resetLink = $"{AngularUrl}{AngularPort}/reset-password?token={jwtNew}";
            var subject = "NUOVO ACCESSO AL SISTEMA RIDEWILD";
            var emailContent = $@"
                <p>E' stato appena registrato un accesso al sistema da IP: {ipAddress}, città: {city}, paese: {country}</p>
                <p>Se non sei stato tu, clicca sul link sottostante per reimpostare la password:</p>        
                <p><a href=""{resetLink}"">{resetLink}</a></p>";

            await _emailService.SendEmail(email, subject, emailContent);
        }

    }

}
