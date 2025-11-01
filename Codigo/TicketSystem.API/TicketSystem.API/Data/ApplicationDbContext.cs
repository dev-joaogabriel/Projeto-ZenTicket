// Data/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;

namespace TicketSystem.API.Data
{
    /// <summary>
    /// Contexto principal do Entity Framework
    /// Implementa conceitos de POO: Encapsulamento, Abstração
    /// Padrões: Repository, Unit of Work (implícito do EF)
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets - Representam as tabelas
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Agent> Agents { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Department> Departments { get; set; }

        /// <summary>
        /// Configuração do modelo de dados
        /// Conceito POO: Template Method Pattern
        /// </summary>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar herança TPH (Table Per Hierarchy) para Users
            ConfigureUserHierarchy(modelBuilder);

            // Configurar entidades específicas
            ConfigureTicketEntity(modelBuilder);
            ConfigureMessageEntity(modelBuilder);
            ConfigureDepartmentEntity(modelBuilder);
            // Attachments disabled: no file uploads in this project

            // Configurar índices para performance
            ConfigureIndexes(modelBuilder);

            // Configurar soft delete global
            ConfigureSoftDelete(modelBuilder);
        }

        /// <summary>
        /// Configurar herança de usuários (TPH - Table Per Hierarchy)
        /// Conceito POO: Herança e Polimorfismo no banco de dados
        /// </summary>
        private void ConfigureUserHierarchy(ModelBuilder modelBuilder)
        {
            // Configuração base para todos os usuários
            modelBuilder.Entity<User>()
                .HasDiscriminator<UserType>("UserType")
                .HasValue<Customer>(UserType.Customer)
                .HasValue<Agent>(UserType.Agent)
                .HasValue<Admin>(UserType.Admin);

            // Configurações específicas do Customer
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.Property(c => c.Department).HasMaxLength(50);
            });

            // Configurações específicas do Agent
            modelBuilder.Entity<Agent>(entity =>
            {
                entity.Property(a => a.Specialization).HasMaxLength(100);
                entity.Property(a => a.Level).HasDefaultValue(1);
                entity.Property(a => a.IsAvailable).HasDefaultValue(true);
            });

            // Configurações específicas do Admin
            modelBuilder.Entity<Admin>(entity =>
            {
                entity.Property(a => a.CanManageUsers).HasDefaultValue(true);
                entity.Property(a => a.CanManageSystem).HasDefaultValue(true);
                entity.Property(a => a.CanViewReports).HasDefaultValue(true);
                entity.Property(a => a.CanManageDepartments).HasDefaultValue(true);
            });
        }

        private void ConfigureTicketEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.Property(t => t.Number).HasMaxLength(20);
                entity.HasIndex(t => t.Number).IsUnique();

                entity.Property(t => t.Subject).HasMaxLength(200).IsRequired();
                entity.Property(t => t.Description).HasMaxLength(2000).IsRequired();

                // Relacionamentos
                entity.HasOne(t => t.Customer)
                    .WithMany(c => c.Tickets)
                    .HasForeignKey(t => t.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.AssignedAgent)
                    .WithMany(a => a.AssignedTickets)
                    .HasForeignKey(t => t.AssignedAgentId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(t => t.Department)
                    .WithMany(d => d.Tickets)
                    .HasForeignKey(t => t.DepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigureMessageEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Message>(entity =>
            {
                entity.Property(m => m.Content).HasMaxLength(5000).IsRequired();

                entity.HasOne(m => m.Ticket)
                    .WithMany(t => t.Messages)
                    .HasForeignKey(m => m.TicketId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Author)
                    .WithMany(u => u.Messages)
                    .HasForeignKey(m => m.AuthorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigureDepartmentEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Department>(entity =>
            {
                entity.Property(d => d.Name).HasMaxLength(100).IsRequired();
                entity.Property(d => d.Description).HasMaxLength(500);
                entity.Property(d => d.Color).HasMaxLength(7);
                entity.HasIndex(d => d.Name).IsUnique();
            });
        }

        // Removed ConfigureAttachmentEntity

        private void ConfigureIndexes(ModelBuilder modelBuilder)
        {
            // Índices para performance
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Priority);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.CreatedAt);
        }

        private void ConfigureSoftDelete(ModelBuilder modelBuilder)
        {
            // Configurar soft delete para todas as entidades que herdam de BaseEntity
            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<Ticket>().HasQueryFilter(t => !t.IsDeleted);
            modelBuilder.Entity<Message>().HasQueryFilter(m => !m.IsDeleted);
            modelBuilder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
            // Attachments removed
        }
    }
}