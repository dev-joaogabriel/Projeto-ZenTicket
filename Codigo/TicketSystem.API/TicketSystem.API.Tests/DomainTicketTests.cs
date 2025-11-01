using System;
using FluentAssertions;
using TicketSystem.API.Models.Entities;
using TicketSystem.API.Models.Enums;
using Xunit;

namespace TicketSystem.API.Tests;

public class DomainTicketTests
{
    private Ticket NewTicket() => new Ticket
    {
        Number = Ticket.GenerateTicketNumber(),
        Subject = "Teste",
        Description = "Desc",
        Priority = TicketPriority.Normal,
        CustomerId = 1,
        DepartmentId = 1,
        CreatedAt = DateTime.UtcNow.AddHours(-2)
    };

    [Fact]
    public void ChangeStatus_ValidTransition_ReturnsTrueAndUpdates()
    {
        var t = NewTicket();
        var ok = t.ChangeStatus(TicketStatus.InProgress);
        ok.Should().BeTrue();
        t.Status.Should().Be(TicketStatus.InProgress);
    }

    [Fact]
    public void ChangeStatus_InvalidTransition_ReturnsFalse_AndDoesNotChange()
    {
        var t = NewTicket();
        var ok = t.ChangeStatus(TicketStatus.Resolved); // Open -> Resolved não permitido direto
        ok.Should().BeFalse();
        t.Status.Should().Be(TicketStatus.Open);
    }

    [Fact]
    public void AssignToAgent_FromOpen_SetsAgent_AndProgress()
    {
        var t = NewTicket();
        t.AssignToAgent(99);
        t.AssignedAgentId.Should().Be(99);
        t.Status.Should().Be(TicketStatus.InProgress);
    }

    [Fact]
    public void IsOverdue_WhenPastSla_IsTrue()
    {
        var t = NewTicket();
        t.SlaHours = 1; // criado há 2h
        t.IsOverdue.Should().BeTrue();
    }

    [Fact]
    public void Rate_ValidRange_SetsRating()
    {
        var t = NewTicket();
        t.Rate(5, "ótimo");
        t.CustomerRating.Should().Be(5);
        t.CustomerFeedback.Should().Be("ótimo");
    }

    [Fact]
    public void Rate_InvalidRange_Ignored()
    {
        var t = NewTicket();
        t.Rate(0, "ruim");
        t.CustomerRating.Should().BeNull();
        t.CustomerFeedback.Should().BeNull();
    }
}
