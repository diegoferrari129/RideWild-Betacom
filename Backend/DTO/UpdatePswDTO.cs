using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class UpdatePswDTO
    {
        [Required]
        public string OldPassword { get; set; } = null!;
        
        [Required(ErrorMessage = "La password è obbligatoria")]
        [MinLength(6, ErrorMessage = "La password deve essere almeno di 6 caratteri")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[!@#$%^&*]).+$", ErrorMessage = "La password deve contenere almeno una lettera maiuscola e un carattere speciale")]
        public string NewPassword { get; set; } = null!;
    }
}
