using System.Text.Json.Serialization;

namespace Relink.ApiService.Data.Entities;

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation only; never serialized so Link → Group responses stay
    // acyclic (and don't embed a link list inside every group).
    [JsonIgnore]
    public List<Link> Links { get; set; } = [];
}