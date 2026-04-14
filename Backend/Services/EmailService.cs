using RideWild.Interfaces;
using RideWild.Models;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace RideWild.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendEmail(string to, string subject, string emailContent)
        {
            try
            {
                var sender = _configuration["EmailDatas:From"];
                var client = _configuration["EmailDatas:Client"];
                var portStr = _configuration["EmailDatas:Port"];
                var username = _configuration["EmailDatas:Username"];
                var password = _configuration["EmailDatas:Password"];

                if (string.IsNullOrWhiteSpace(sender) || string.IsNullOrWhiteSpace(client) ||
                    string.IsNullOrWhiteSpace(portStr) || string.IsNullOrWhiteSpace(username) ||
                    string.IsNullOrWhiteSpace(password))
                {
                    Log.Error("[EmailService] Configurazione email mancante o incompleta.");
                    return false;
                }

                if (!int.TryParse(portStr, out int port))
                {
                    Log.Error($"[EmailService] Porta SMTP non valida: {portStr}");
                    return false;
                }

                var email = new MailMessage
                {
                    From = new MailAddress(sender),
                    Subject = subject,
                    Body = emailContent,
                    IsBodyHtml = true
                };
                email.To.Add(new MailAddress(to));

                using var smtp = new SmtpClient(client, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true
                };

                await smtp.SendMailAsync(email);
                return true;
            }
            catch (SmtpException smtpEx)
            {
                Log.Error($"[EmailService] Errore SMTP: {smtpEx.Message}");
                return false;
            }
            catch (FormatException fmtEx)
            {
                Log.Error($"[EmailService] Errore formato indirizzo email: {fmtEx.Message}");
                return false;
            }
            catch (Exception ex)
            {
                Log.Error($"[EmailService] Errore generico: {ex.Message}");
                return false;
            }
        }
    }
}
