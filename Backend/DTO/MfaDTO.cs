using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class MfaDTO
    {
        [Required(ErrorMessage = "L'indirizzo email è obbligatorio")]
        [EmailAddress(ErrorMessage = "Formato email non valido")]
        [MaxLength(100, ErrorMessage = "L'email non può superare i 100 caratteri")]
        public string EmailAddress { get; set; } = null!;

        public bool IsMfaEnabled { get; set; }
    }
}
