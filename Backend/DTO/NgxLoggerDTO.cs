
using System.Text.Json;

namespace RideWild.DTO
{
    public class NgxLoggerDTO
    {
        public int Level { get; set; }
        public string Message { get; set; } = null!;
        public string Timestamp { get; set; } = null!;
        public List<JsonElement>? Additional { get; set; } = null!;
        public string? FileName { get; set; }
        public int? LineNumber { get; set; }
        public int? ColumnNumber { get; set; }
    }
}
