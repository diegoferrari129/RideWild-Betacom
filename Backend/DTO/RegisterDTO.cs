using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class RegisterDTO
    {
        [Required(ErrorMessage = "Il nome è obbligatorio")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Il nome deve essere tra 2 e 50 caratteri")]
        public string FirstName { get; set; } = null!;

        [Required(ErrorMessage = "Il cognome è obbligatorio")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Il cognome deve essere tra 2 e 50 caratteri")]
        public string LastName { get; set; } = null!;

        [Required(ErrorMessage = "L'email è obbligatoria")]
        [EmailAddress(ErrorMessage = "Inserisci un indirizzo email valido")]
        public string EmailAddress { get; set; } = null!;

        [Required(ErrorMessage = "Il numero di telefono è obbligatorio")]
        [Phone(ErrorMessage = "Inserisci un numero di telefono valido")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "La password è obbligatoria")]
        [MinLength(6, ErrorMessage = "La password deve essere almeno di 6 caratteri")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[!@#$%^&*]).+$", ErrorMessage = "La password deve contenere almeno una lettera maiuscola e un carattere speciale")]
        public string Password { get; set; } = null!;
    }

}
