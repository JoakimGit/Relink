namespace Relink.ApiService.Data.Entities;

public class ShortenedLink
{
    public required string Id { get; set; }
    public string LongUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Description { get; set; }
    public string? FallbackUrl { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public string? PasswordHash { get; set; }
    public int? MaxUsages { get; set; }
    public int CurrentUsages { get; set; } = 0;
    public bool IsLocked { get; set; } = false;

    public LinkMetadata? Metadata { get; set; }
    public List<LinkAnalytics> Analytics { get; set; } = [];
    public List<Tag> Tags { get; set; } = [];
    public Group? Group { get; set; }
    public int? GroupId { get; set; }
}