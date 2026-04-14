using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideWild.Models.ChatModels;
using RideWild.Services;
using RideWild.Utility;
using Serilog;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace RideWild.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly ChatRepository _repo;

        public ChatController(ChatRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("{threadId}/messages")]
        public async Task<IActionResult> GetMessages(string threadId)
        {
            try
            {
                var messages = await _repo.GetMessagesByThreadIdAsync(threadId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetMessages] Errore durante il recupero dei messaggi per threadId: {ThreadId}", threadId);
                return StatusCode(500, "Errore interno durante il recupero dei messaggi.");
            }
        }

        [Authorize]
        [HttpGet("threads-by-customer")]
        public async Task<IActionResult> GetCustomerThreads()
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var threads = await _repo.GetCustomerThreadsAsync(userId.ToString());
                return Ok(threads);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetCustomerThreads] Errore durante il recupero dei thread del cliente: {UserId}", userId);
                return StatusCode(500, "Errore interno durante il recupero dei thread.");
            }
        }

        [Authorize]
        [HttpGet("threads")]
        public async Task<IActionResult> GetAllThreads()
        {
            try
            {
                var threads = await _repo.GetAllThreadsAsync();
                return Ok(threads);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAllThreads] Errore durante il recupero di tutti i thread");
                return StatusCode(500, "Errore interno durante il recupero dei thread.");
            }
        }

        [Authorize]
        [HttpPost("threads")]
        public async Task<IActionResult> CreateThread([FromBody] CreateThreadRequest request)
        {
            if (!Helper.TryGetUserId(User, out int userId))
                return Unauthorized("Utente non autenticato o ID non valido");

            try
            {
                var thread = await _repo.CreateThreadAsync(userId.ToString(), request.Subject);
                return Ok(thread);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CreateThread] Errore durante la creazione del thread per userId: {UserId}", userId);
                return StatusCode(500, "Errore interno durante la creazione del thread.");
            }
        }

        [Authorize]
        [HttpPut("threadsNoAI/{threadId}")]
        public async Task<IActionResult> ChatWithAdmin(string threadId)
        {
            try
            {
                var thread = await _repo.ChatWithAdmin(threadId);
                return Ok(thread);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ChatWithAdmin] Errore durante il passaggio ad admin per threadId: {ThreadId}", threadId);
                return StatusCode(500, "Errore interno durante l'aggiornamento del thread.");
            }
        }

        [Authorize(Policy = "Admin")]
        [HttpPut("threads/{threadId}")]
        public async Task<IActionResult> CloseThread(string threadId)
        {
            try
            {
                var thread = await _repo.CloseThreadAsync(threadId);
                return Ok(thread);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CloseThread] Errore durante la chiusura del thread con ID: {ThreadId}", threadId);
                return StatusCode(500, "Errore interno durante la chiusura del thread.");
            }
        }
    }

}
