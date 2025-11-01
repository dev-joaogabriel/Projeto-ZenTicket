using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public UsersController(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: /api/users
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? q = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 200);
            var query = _db.Users.AsNoTracking().OrderBy(u => u.Id).AsQueryable();
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(u => u.Email.Contains(term) || (u.FirstName + " " + u.LastName).Contains(term));
            }

            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = items.Select(u => _mapper.Map<UserDto>(u)).ToList();
            return Ok(new { Message = "Usuários obtidos", Data = new { Total = total, Page = page, PageSize = pageSize, Items = dtos } });
        }

        // POST: /api/users
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return Conflict(new { Message = "Email já cadastrado" });
            }

            User entity;
            switch (dto.UserType)
            {
                case UserType.Agent:
                    entity = new Agent
                    {
                        FirstName = dto.FirstName,
                        LastName = dto.LastName,
                        Email = dto.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                        UserType = UserType.Agent,
                        IsActive = dto.IsActive,
                        Specialization = dto.Specialization ?? string.Empty,
                        Level = dto.Level ?? 1,
                        IsAvailable = dto.IsAvailable ?? true
                    };
                    break;
                case UserType.Admin:
                    entity = new Admin
                    {
                        FirstName = dto.FirstName,
                        LastName = dto.LastName,
                        Email = dto.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                        UserType = UserType.Admin,
                        IsActive = dto.IsActive
                    };
                    break;
                default:
                    entity = new Customer
                    {
                        FirstName = dto.FirstName,
                        LastName = dto.LastName,
                        Email = dto.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                        UserType = UserType.Customer,
                        IsActive = dto.IsActive,
                        Department = dto.Department
                    };
                    break;
            }

            _db.Users.Add(entity);
            await _db.SaveChangesAsync();

            var result = _mapper.Map<UserDto>(entity);
            return CreatedAtAction(nameof(GetAll), new { id = entity.Id }, new { Message = "Usuário criado", Data = result });
        }
    }
}

