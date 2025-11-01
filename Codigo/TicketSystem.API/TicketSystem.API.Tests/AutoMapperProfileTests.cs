using AutoMapper;
using TicketSystem.API.Configuration;
using Xunit;

namespace TicketSystem.API.Tests;

public class AutoMapperProfileTests
{
    [Fact]
    public void AutoMapper_Configuration_IsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<AutoMapperProfile>());
        config.AssertConfigurationIsValid();
    }
}
