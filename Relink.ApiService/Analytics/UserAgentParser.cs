namespace Relink.ApiService.Analytics;

public static class UserAgentParser
{
    /// <summary>
    /// Maps a raw User-Agent string to a coarse browser family.
    /// Order matters: Chromium-based browsers (Edge, Opera) and Chrome all
    /// advertise both "Chrome/" and "Safari/", so the most specific tokens
    /// must be checked first.
    /// </summary>
    public static string Parse(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return "Unknown";

        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Edge/", StringComparison.OrdinalIgnoreCase))
            return "Edge";

        if (userAgent.Contains("OPR/", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Opera/", StringComparison.OrdinalIgnoreCase))
            return "Opera";

        if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase))
            return "Chrome";

        if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase))
            return "Firefox";

        if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase))
            return "Safari";

        if (userAgent.Contains("MSIE", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Trident/", StringComparison.OrdinalIgnoreCase))
            return "Internet Explorer";

        return "Other";
    }
}
