namespace RideWild.Models
{
    public class AuthResult
    {
        public bool Success { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string? Message { get; set; }
        public bool IsMfaEnabled { get; set; } 

        public string MfaCode { get; set; } = string.Empty;
        public DateTime MfaCodeExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(2);

        public static AuthResult SuccessAuth(string token, string refreshToken, bool isMfaEnable = false, string mfaCode = "", DateTime? expire = null)
        {
            return new AuthResult { Success = true, Token = token, RefreshToken=refreshToken, IsMfaEnabled = isMfaEnable, MfaCode = mfaCode, MfaCodeExpiresAt = expire ?? DateTime.Now };
        }
        public static AuthResult FailureAuth(string message)
        {
            return new AuthResult { Success = false, Message = message };
        }

        public static AuthResult SuccessOperation()
        {
            return new AuthResult { Success = true};
        }

    }

}
