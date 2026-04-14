
using Microsoft.AspNetCore.Mvc;
using RideWild.DTO;
using Serilog;
using Serilog.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NgxLoggerController : ControllerBase
    {
        private readonly Serilog.ILogger _logger;

        public NgxLoggerController(Serilog.ILogger logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IActionResult PostLog([FromBody] NgxLoggerDTO ngxLogger)
        {
            if (ngxLogger == null)
            {
                _logger.Warning("Received null NgxLoggerDTO from frontend. This might indicate an invalid payload.");
                return BadRequest("Ngx Log non valido");
            }

            // conversione del livello da ngx
            LogEventLevel serilogLevel;
            switch (ngxLogger.Level)
            {
                case 0: serilogLevel = LogEventLevel.Verbose; break;
                case 1: serilogLevel = LogEventLevel.Debug; break;
                case 2: serilogLevel = LogEventLevel.Information; break;
                case 3: serilogLevel = LogEventLevel.Information; break;
                case 4: serilogLevel = LogEventLevel.Warning; break;
                case 5: serilogLevel = LogEventLevel.Error; break;
                case 6: serilogLevel = LogEventLevel.Fatal; break;
                default: serilogLevel = LogEventLevel.Information; break;
            }

            var logProperties = new Dictionary<string, object>();

            logProperties["Angular"] = "Angular";
            logProperties["AngularTimestamp"] = ngxLogger.Timestamp;

            if (ngxLogger.FileName != null) logProperties["FileName"] = ngxLogger.FileName;
            if (ngxLogger.LineNumber.HasValue) logProperties["LineNumber"] = ngxLogger.LineNumber.Value;
            if (ngxLogger.ColumnNumber.HasValue) logProperties["ColumnNumber"] = ngxLogger.ColumnNumber.Value;

            // gestione degli additional
            if (ngxLogger.Additional != null && ngxLogger.Additional.Any())
            {
                // ngx-logger invia l'errorContext come il primo elemento dell'array 'additional'
                // Controlla se il primo elemento è un oggetto JSON
                if (ngxLogger.Additional[0].ValueKind == JsonValueKind.Object)
                {
                    // Enumera le proprietà dell'oggetto JSON
                    foreach (var prop in ngxLogger.Additional[0].EnumerateObject())
                    {
                        // Converte JsonElement in un tipo C# appropriato
                        logProperties[prop.Name] = GetObjectFromJsonElement(prop.Value);
                    }
                }
                else
                {
                    // Se non è un oggetto, aggiungi l'intera lista di JsonElement grezzi
                    logProperties["RawAdditional"] = ngxLogger.Additional.Select(je => GetObjectFromJsonElement(je)).ToList();
                }
            }

            _logger.Write(serilogLevel, ngxLogger.Message, logProperties);

            return Ok();
        }

        /// <summary>
        /// Metodo helper privato per convertire un JsonElement (da System.Text.Json)
        /// in un oggetto C# che Serilog può loggare.
        /// </summary>
        private static object? GetObjectFromJsonElement(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.GetDouble(), // Usa GetDouble() per generalità
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                JsonValueKind.Object => JsonDocument.Parse(element.GetRawText()).RootElement.GetRawText(), // Restituisce l'oggetto JSON come stringa
                JsonValueKind.Array => element.EnumerateArray().Select(e => GetObjectFromJsonElement(e)).ToList(),
                _ => null, // Tipo non gestito
            };
        }
    }
}