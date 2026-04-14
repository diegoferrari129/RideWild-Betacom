namespace RideWild.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmail(string to, string subject, string emailContent);
    }
}
