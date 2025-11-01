using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;
using TicketSystem.API.Services.Interfaces;
using AutoMapper;

namespace TicketSystem.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IMapper mapper)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto request)
        {
            try
            {
                // Buscar usuário por email (incluindo todos os tipos)
                var user = await _context.Set<User>()
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return null;
                }

                // Atualizar último login
                user.UpdateLastLogin();
                await _context.SaveChangesAsync();

                // Converter para DTO
                var userDto = _mapper.Map<UserDto>(user);

                // Gerar tokens
                var token = GenerateJwtToken(userDto);
                var refreshToken = GenerateRefreshToken();

                // Salvar refresh token (opcional - pode implementar tabela separada)

                return new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    User = userDto
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto request)
        {
            try
            {
                // Verificar se email já existe
                var existingUser = await _context.Set<User>()
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    return null; // Email já existe
                }

                // Criar novo cliente (registro padrão é sempre cliente)
                var customer = new Customer
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Department = request.Department,
                    IsActive = true
                };

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                // Converter para DTO
                var userDto = _mapper.Map<UserDto>(customer);

                // Gerar tokens
                var token = GenerateJwtToken(userDto);
                var refreshToken = GenerateRefreshToken();

                return new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    User = userDto
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            // Implementar lógica de refresh token se necessário
            // Por simplicidade, retornando null por enquanto
            await Task.CompletedTask;
            return null;
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            // Implementar lógica de revogação se necessário
            await Task.CompletedTask;
            return true;
        }

        public string GenerateJwtToken(UserDto user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? "TicketSystem2024SuperSecretKeyForJWT!@#$%"));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.UserType.ToString()),
                new Claim("UserType", user.UserType.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "TicketSystemAPI",
                audience: _configuration["Jwt:Audience"] ?? "TicketSystemClient",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            var user = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            return user != null ? _mapper.Map<UserDto>(user) : null;
        }
    }
}