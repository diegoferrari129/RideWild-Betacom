using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace RideWild.Models.ChatModels
{
    public class ChatThread
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        public bool IsOpened { get; set; } = true;
        public bool IsAi { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
