using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace RideWild.Models.ChatModels
{
    public class ChatMessage
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string ThreadId { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
