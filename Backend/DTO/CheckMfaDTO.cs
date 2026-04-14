using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class CheckMfaDTO
    {
        [Required(ErrorMessage = "Il codice MFA è obbligatorio")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Il codice MFA deve contenere esattamente 6 cifre")]
        public string? MfaCode { get; set; }

    }
}
