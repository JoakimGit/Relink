namespace Relink.ApiService.Data.Entities;

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<ShortenedLink> ShortenedLinks { get; set; } = [];
}