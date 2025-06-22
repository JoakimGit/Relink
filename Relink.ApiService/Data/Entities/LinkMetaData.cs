namespace Relink.ApiService.Data.Entities;

public class LinkMetadata
{
    public int Id { get; set; }
    public required string ShortenedLinkId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? SiteName { get; set; }
    public DateTime? LastScrapedAt { get; set; }

    public ShortenedLink ShortenedLink { get; set; } = null!;
}
