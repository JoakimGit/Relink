namespace Relink.ApiService.Data.Entities;

public class LinkAnalytics
{
    public long Id { get; set; }
    public required string ShortenedLinkId { get; set; }
    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? Referrer { get; set; }
    public string? UserAgent { get; set; }

    public ShortenedLink ShortenedLink { get; set; } = null!;
}