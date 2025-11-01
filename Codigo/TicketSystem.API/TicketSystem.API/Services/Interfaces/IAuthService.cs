using TicketSystem.API.Models.DTOs;

namespace TicketSystem.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginRequestDto request);
        Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
        string GenerateJwtToken(UserDto user);
        string GenerateRefreshToken();
        Task<UserDto?> GetUserByIdAsync(int userId);
    }
}