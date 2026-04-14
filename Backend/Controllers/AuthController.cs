using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using RideWild.Models.DataModels;
using RideWild.DTO;
using RideWild.Interfaces;
using RideWild.Models.AdventureModels;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Http.HttpResults;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /*
         * POST api/auth/login
         * Customer login endpoint.
         * Authenticates a customer and returns JWT and refresh token on success.
         */
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO loginDTO)
        {

            var result = await _authService.Login(loginDTO);
            if (!result.Success)
                return Unauthorized(result.Message);

            return Ok(result);
        }

        /*
         * POST api/auth/register
         * Customer registration endpoint.
         * Registers a new customer account.
         */
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO registerDTO)
        {
            var result = await _authService.Register(registerDTO);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result);
        }

        /*
         * POST api/auth/refresh-token
         * Refresh JWT token endpoint.
         * Accepts a refresh token and returns a new JWT and refresh token.
         */
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenDTO refreshTokenDTO)
        {
            var result = await _authService.RefreshToken(refreshTokenDTO);
            if (!result.Success)
                return Unauthorized(result.Message);

            return Ok(result);
        }

        /*
         * POST api/auth/logout
         * Customer logout endpoint.
         * Invalidates the refresh token for the customer.
         */
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(RefreshTokenDTO refreshTokenDTO)
        {
            var result = await _authService.Logout(refreshTokenDTO);
            if (!result.Success)
                return Unauthorized(result.Message);

            return Ok(result);
        }

        /*
         * POST api/auth/reset-password
         * Customer password reset endpoint.
         * Resets the customer password based on provided data (token and new password).
         */
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDTO resetPasswordDTO)
        {
            var result = await _authService.ResetPassword(resetPasswordDTO);
            if (!result.Success)
                return BadRequest(result.Message);
            return Ok(result);
        }

        /*
        * POST api/auth/recovery-password-request
        * Sends an email with a password recovery link.
        */
        [HttpPost("recovery-password-request")]
        public async Task<IActionResult> SendEmailRecoveryPassword([FromBody] string email)
        {
            var result = await _authService.SendEmailRecoveryPassword(email);
            if (!result.Success)
                return BadRequest(result.Message);
            return Ok(result);
        }

        /*
         * POST api/auth/update-password
         * Recoveries the customer password.
         */
        [HttpPost("recovery-password")]
        public async Task<IActionResult> RecoveryPassword(ResetPasswordDTO recoveryPasswordDTO)
        {
            var result = await _authService.RecoveryPassword(recoveryPasswordDTO);
            if (!result.Success)
                return BadRequest(result.Message);
            return Ok(result);
        }
    }
}
