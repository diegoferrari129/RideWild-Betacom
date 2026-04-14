using MongoDB.Driver;
using RideWild.Models.ChatModels;
using Serilog;

namespace RideWild.Services
{
    public class ChatRepository
    {
        private readonly IMongoCollection<ChatThread> _threads;
        private readonly IMongoCollection<ChatMessage> _messages;

        public ChatRepository(IConfiguration config)
        {
            var client = new MongoClient(config.GetConnectionString("MongoDb"));
            var database = client.GetDatabase("ChatSignal");

            _threads = database.GetCollection<ChatThread>("chatThreads");
            _messages = database.GetCollection<ChatMessage>("chatMessages");
        }

        public async Task<List<ChatThread>> GetAllThreadsAsync()
        {
            try
            {
                return await _threads.Find(_ => true).ToListAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAllThreadsAsync] Errore durante il recupero di tutti i thread");
                return new List<ChatThread>();
            }
        }

        public async Task<List<ChatThread>> GetCustomerThreadsAsync(string customerId)
        {
            try
            {
                return await _threads.Find(c => c.UserId == customerId).ToListAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetCustomerThreadsAsync] Errore durante il recupero dei thread per customerId: {CustomerId}", customerId);
                return new List<ChatThread>();
            }
        }

        public async Task<List<ChatMessage>> GetMessagesByThreadIdAsync(string threadId)
        {
            try
            {
                return await _messages.Find(m => m.ThreadId == threadId).SortBy(m => m.Timestamp).ToListAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetMessagesByThreadIdAsync] Errore durante il recupero dei messaggi per threadId: {ThreadId}", threadId);
                return new List<ChatMessage>();
            }
        }

        public async Task UpdateThreadAsync(ChatThread updatedThread)
        {
            try
            {
                var filter = Builders<ChatThread>.Filter.Eq(t => t.Id, updatedThread.Id);
                await _threads.ReplaceOneAsync(filter, updatedThread);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UpdateThreadAsync] Errore durante l'aggiornamento del thread con ID: {ThreadId}", updatedThread.Id);
            }
        }

        public async Task InsertMessageAsync(ChatMessage message)
        {
            try
            {
                await _messages.InsertOneAsync(message);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[InsertMessageAsync] Errore durante l'inserimento del messaggio per threadId: {ThreadId}", message.ThreadId);
            }
        }

        public async Task<ChatThread?> CreateThreadAsync(string userId, string subject)
        {
            try
            {
                var thread = new ChatThread
                {
                    UserId = userId,
                    Subject = subject,
                    CreatedAt = DateTime.Now
                };

                await _threads.InsertOneAsync(thread);
                return thread;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CreateThreadAsync] Errore durante la creazione del thread per userId: {UserId}", userId);
                return null;
            }
        }

        public async Task<ChatThread?> ChatWithAdmin(string threadId)
        {
            try
            {
                await _threads.UpdateOneAsync(
                    t => t.Id == threadId,
                    Builders<ChatThread>.Update.Set(t => t.IsAi, false)
                );

                return await _threads.Find(t => t.Id == threadId).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ChatWithAdmin] Errore durante il passaggio ad admin per threadId: {ThreadId}", threadId);
                return null;
            }
        }

        public async Task<ChatThread?> CloseThreadAsync(string threadId)
        {
            try
            {
                await _threads.UpdateOneAsync(
                    t => t.Id == threadId,
                    Builders<ChatThread>.Update.Set(t => t.IsOpened, false)
                );

                return await _threads.Find(t => t.Id == threadId).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CloseThreadAsync] Errore durante la chiusura del thread con ID: {ThreadId}", threadId);
                return null;
            }
        }

        public async Task<ChatThread?> GetThreadByIdAsync(string threadId)
        {
            try
            {
                var filter = Builders<ChatThread>.Filter.Eq(t => t.Id, threadId);
                return await _threads.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetThreadByIdAsync] Errore durante il recupero del thread con ID: {ThreadId}", threadId);
                return null;
            }
        }
    }

}
