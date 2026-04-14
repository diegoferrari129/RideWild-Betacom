using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace RideWild.DTO
{
    public class AddressDTO
    {
        public int AddressId { get; set; }

        [Required(ErrorMessage = "L'indirizzo principale è obbligatorio.")]
        [MinLength(2, ErrorMessage = "L'indirizzo principale deve contenere almeno 2 caratteri.")]
        [MaxLength(100, ErrorMessage = "L'indirizzo principale non può superare i 100 caratteri.")]
        public string AddressLine1 { get; set; } = null!;

        [MaxLength(100, ErrorMessage = "L'indirizzo secondario non può superare i 100 caratteri.")]
        public string? AddressLine2 { get; set; }

        [Required(ErrorMessage = "La città è obbligatoria.")]
        [MinLength(2, ErrorMessage = "La città deve contenere almeno 2 caratteri.")]
        [MaxLength(50, ErrorMessage = "La città non può superare i 50 caratteri.")]
        public string City { get; set; } = null!;

        [Required(ErrorMessage = "La provincia/regione è obbligatoria.")]
        [MinLength(2, ErrorMessage = "La provincia/regione deve contenere almeno 2 caratteri.")]
        [MaxLength(50, ErrorMessage = "La provincia/regione non può superare i 50 caratteri.")]
        public string StateProvince { get; set; } = null!;

        [Required(ErrorMessage = "Il paese è obbligatorio.")]
        [MinLength(2, ErrorMessage = "Il paese deve contenere almeno 2 caratteri.")]
        [MaxLength(50, ErrorMessage = "Il paese non può superare i 50 caratteri.")]
        public string CountryRegion { get; set; } = null!;

        [Required(ErrorMessage = "Il CAP è obbligatorio.")]
        [RegularExpression(@"^\d{5}$", ErrorMessage = "Il CAP deve contenere esattamente 5 cifre.")]
        public string PostalCode { get; set; } = null!;

        [Required(ErrorMessage = "Il tipo di indirizzo è obbligatorio.")]
        [MinLength(2, ErrorMessage = "Il tipo di indirizzo deve contenere almeno 2 caratteri.")]
        [MaxLength(30, ErrorMessage = "Il tipo di indirizzo non può superare i 30 caratteri.")]
        public string AddressType { get; set; } = null!;
    }



}
