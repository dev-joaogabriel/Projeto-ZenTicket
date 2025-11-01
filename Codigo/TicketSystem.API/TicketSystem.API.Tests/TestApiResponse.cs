namespace TicketSystem.API.Tests;

// Generic API response models to unify test deserialization of controller anonymous objects.
public class ApiResponse<T>
{
    public string? Message { get; set; }
    public T? Data { get; set; }
}

public class PagedResult<TItem>
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public TItem[] Items { get; set; } = [];
}
