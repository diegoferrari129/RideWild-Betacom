using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using RideWild.DTO;
using RideWild.Models;
using RideWild.Models.DataModels;

namespace RideWild.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResult> Login(LoginDTO request);
        Task<AuthResult> Register(RegisterDTO request);
        Task<AuthResult> ResetPassword(ResetPasswordDTO resetPassword);
        Task<AuthResult> RefreshToken(RefreshTokenDTO refreshToken);
        Task<AuthResult> Logout(RefreshTokenDTO refreshToken);
        Task<AuthResult> RecoveryPassword(ResetPasswordDTO resetPassword);
        Task<AuthResult> SendEmailRecoveryPassword(string email);
        string GenerateJwtTokenResetPwd(string email);
        string GenerateJwtToken(CustomerData customer, bool mfaConfirmed = false);
        string GenerateJwtTokenConfirmEmail(string id);
        Task<bool> CheckEmailExistsAsync(string email);

    }
}
