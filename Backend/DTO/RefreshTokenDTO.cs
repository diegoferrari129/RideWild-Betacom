using System.ComponentModel.DataAnnotations;

namespace RideWild.DTO
{
    public class RefreshTokenDTO
    {
        [Required]
        [MinLength(1, ErrorMessage = "Il refresh token non può essere vuoto")]
        public string RefreshToken { get; set; } = null!;
    }
}
