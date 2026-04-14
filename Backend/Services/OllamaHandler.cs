namespace RideWild.Services
{
    public class OllamaHandler
    {
        public static HttpClient _httpClient = new HttpClient()
        {
            BaseAddress = new Uri("http://5.180.148.50:11435/"),
            Timeout = TimeSpan.FromSeconds(400)
        };

    }
}
