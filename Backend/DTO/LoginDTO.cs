using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class LoginDTO
    {
        [Required]
        [EmailAddress(ErrorMessage = "Inserisci un indirizzo email valido")]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }
}
