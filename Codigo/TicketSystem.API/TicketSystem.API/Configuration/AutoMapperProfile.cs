using AutoMapper;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Models.Entities;

namespace TicketSystem.API.Configuration
{
    /// <summary>
    /// Perfil do AutoMapper para mapeamento de entidades
    /// Conceito POO: Padrão Adapter e Data Transfer Object
    /// </summary>
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // Mapeamento de User para UserDto
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
                // Campos específicos de Agent só serão preenchidos no mapa de Agent
                .ForMember(dest => dest.Specialization, opt => opt.Ignore())
                .ForMember(dest => dest.Level, opt => opt.Ignore())
                .ForMember(dest => dest.IsAvailable, opt => opt.Ignore())
                .IncludeAllDerived();

            CreateMap<Customer, UserDto>()
                .IncludeBase<User, UserDto>();

            CreateMap<Agent, UserDto>()
                .IncludeBase<User, UserDto>()
                .ForMember(dest => dest.Specialization, opt => opt.MapFrom(src => src.Specialization))
                .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => src.IsAvailable));

            CreateMap<Admin, UserDto>()
                .IncludeBase<User, UserDto>();

            // Reverse mapping: ignorar propriedades de navegação e somente leitura
            CreateMap<UserDto, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Tickets, opt => opt.Ignore())
                .ForMember(dest => dest.Messages, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore());

            // Ticket -> DTOs
            CreateMap<Ticket, TicketSummaryDto>()
                .ForMember(d => d.Department, o => o.MapFrom(s => s.Department.Name))
                .ForMember(d => d.Customer, o => o.MapFrom(s => s.Customer.FullName))
                .ForMember(d => d.AssignedAgent, o => o.MapFrom(s => s.AssignedAgent != null ? s.AssignedAgent.FullName : null))
                .ForMember(d => d.MessageCount, o => o.MapFrom(s => s.Messages.Count))
                .ForMember(d => d.IsOverdue, o => o.MapFrom(s => s.IsOverdue));

            CreateMap<Ticket, TicketDetailDto>()
                .IncludeBase<Ticket, TicketSummaryDto>()
                .ForMember(d => d.ResolutionTimeHours, o => o.MapFrom(s => s.ResolutionTimeHours))
                .ForMember(d => d.FirstResponseTimeHours, o => o.MapFrom(s => s.FirstResponseTimeHours));
        }
    }
}