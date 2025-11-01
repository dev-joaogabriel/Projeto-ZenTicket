using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Services.Interfaces;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Realizar login no sistema
        /// </summary>
        /// <param name="request">Dados de login</param>
        /// <returns>Token JWT e informações do usuário</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Dados inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            var result = await _authService.LoginAsync(request);

            if (result == null)
            {
                return Unauthorized(new { Message = "Email ou senha inválidos" });
            }

            return Ok(new
            {
                Message = "Login realizado com sucesso",
                Data = result
            });
        }

        /// <summary>
        /// Registrar novo cliente
        /// </summary>
        /// <param name="request">Dados do cliente</param>
        /// <returns>Token JWT e informações do usuário</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Dados inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            var result = await _authService.RegisterAsync(request);

            if (result == null)
            {
                return BadRequest(new { Message = "Email já está em uso ou erro interno" });
            }

            return CreatedAtAction(nameof(GetProfile), new { }, new
            {
                Message = "Conta criada com sucesso",
                Data = result
            });
        }

        /// <summary>
        /// Obter perfil do usuário logado
        /// </summary>
        /// <returns>Informações do usuário</returns>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized(new { Message = "Token inválido" });
            }

            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "Usuário não encontrado" });
            }

            return Ok(new
            {
                Message = "Perfil obtido com sucesso",
                Data = user
            });
        }

        /// <summary>
        /// Renovar token JWT
        /// </summary>
        /// <param name="request">Refresh token</param>
        /// <returns>Novo token JWT</returns>
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new { Message = "Refresh token é obrigatório" });
            }

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (result == null)
            {
                return Unauthorized(new { Message = "Refresh token inválido" });
            }

            return Ok(new
            {
                Message = "Token renovado com sucesso",
                Data = result
            });
        }

        /// <summary>
        /// Logout (revogar refresh token)
        /// </summary>
        /// <param name="request">Refresh token para revogar</param>
        /// <returns>Confirmação de logout</returns>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
        {
            if (!string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
            }

            return Ok(new { Message = "Logout realizado com sucesso" });
        }
    }
}