using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RideWild.Models.ChatModels;
using Serilog;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace RideWild.Services
{
    public class ChatHub : Hub
    {
        private readonly ChatRepository _repo;

        public ChatHub(ChatRepository repo)
        {
            _repo = repo;
        }

        public async Task SendMessage(string threadId, string userId, string message)
        {
            var thread = await _repo.GetThreadByIdAsync(threadId);

            if (thread == null || !thread.IsOpened)
            {
                await Clients.Caller.SendAsync("ThreadClosed", threadId);
                return;
            }

            var chatMessage = new ChatMessage
            {
                ThreadId = threadId,
                SenderId = userId,
                Message = message,
                Timestamp = DateTime.UtcNow
            };

            await _repo.InsertMessageAsync(chatMessage);
            await Clients.Group(threadId).SendAsync("ReceiveMessage", userId, message, chatMessage.Timestamp);

            if (thread.IsAi)
            {
                var messages = await _repo.GetMessagesByThreadIdAsync(threadId);
                var aiResponse = await GetAiResponse(messages);

                var aiMessageFinal = new ChatMessage
                {
                    ThreadId = threadId,
                    SenderId = "CHATBOT",
                    Message = aiResponse,
                    Timestamp = DateTime.UtcNow
                };

                await _repo.InsertMessageAsync(aiMessageFinal);
                await Clients.Group(threadId).SendAsync("ReceiveMessage", "CHATBOT", aiResponse, aiMessageFinal.Timestamp);
            }
        }

        private async Task<string> GetAiResponse(List<ChatMessage> messages)
        {
            var context = new List<Dictionary<string, string>>();

            context.Add(new Dictionary<string, string>
            {
                { "role", "system" },
                { "content",
                    "Sei un assistente virtuale per un sito e-commerce. Il tuo compito è aiutare gli utenti solo con problemi relativi a:\n" +
                    "- ordini\n" +
                    "- spedizioni\n" +
                    "- resi\n" +
                    "- pagamenti\n" +
                    "- account e impostazioni\n" +
                    "- prodotti venduti sul sito\n\n" +

                    "Non devi mai rispondere a domande che esulano da questo ambito, come:\n" +
                    "- traduzioni\n" +
                    "- informazioni generali, scolastiche o personali\n\n" +

                    "In questi casi rispondi con:\n" +
                    "\"Mi dispiace, posso aiutarti solo con domande relative agli ordini, spedizioni, prodotti o impostazioni del tuo account.\"\n\n" +

                    "Se l'utente vuole cambiare la password, rispondi con:\n" +
                    "\"Per cambiare la password, vai qui: https://ridewild.site/personal-profile/change-security\"\n\n" +

                    "Se vuole aumentare la sicurezza dell'account, rispondi con:\n" +
                    "\"Per aumentare la sicurezza del tuo account puoi attivare l'autenticazione a due fattori (MFA), ma prima devi aver confermato l'indirizzo email. Puoi farlo da qui: https://ridewild.site/personal-profile/change-security\"\n\n" +

                    "Se chiede consigli sui prodotti, rispondi con:\n" +
                    "\"Non posso dare consigli sui prodotti, ma puoi sfogliare il nostro catalogo e filtrare i prodotti in base ai tuoi gusti qui: https://ridewild.site/products\"\n\n" +

                    "Se vuole parlare con un operatore, rispondi con:\n" +
                    "\"Clicca sul pulsante qui sotto per parlare con un operatore umano.\"\n\n" +

                    "Se ti viene chiesto *chi sei* o semplicemente ti viene rivolto un saluto, rispondi semplicemente:\n" +
                    "\"Sono l'assistente virtuale di RideWild. Posso aiutarti solo con richieste relative al nostro e-commerce.\"\n\n" +

                    "Non generare mai link o risposte diverse da queste. Usa sempre un tono educato, semplice e diretto."
                }
            });

            var contextMessages = messages.TakeLast(10).ToList(); 

            foreach (var msg in contextMessages)
            {
                var role = msg.SenderId == "CHATBOT" ? "assistant" : "user";
                context.Add(new Dictionary<string, string>
                {
                    { "role", role },
                    { "content", msg.Message }
                });
            }

            var request = new
            {
                model = "gemma:2b",
                messages = context,
                stream = false
            };

            try
            {
                var response = await OllamaHandler._httpClient.PostAsJsonAsync("/api/chat", request);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadFromJsonAsync<JsonElement>();
                var reply = content.GetProperty("message").GetProperty("content").GetString();
                return reply ?? "Non riesco a rispondere al momento.";
            }
            catch (Exception ex)
            {
                return "Si è verificato un errore nella risposta AI.";
            }
        }


        public override async Task OnConnectedAsync()
        {
            if (Context.GetHttpContext() is { } httpContext)
            {
                var threadId = httpContext.Request.Query["threadId"].ToString();
                await Groups.AddToGroupAsync(Context.ConnectionId, threadId);
            }
            else
            {
                Log.Warning("[OnConnectedAsync] HttpContext is null. ConnectionId: {ConnectionId}", Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

    }
}
