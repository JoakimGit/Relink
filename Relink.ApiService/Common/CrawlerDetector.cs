namespace Relink.ApiService.Common;

public static class CrawlerDetector
{
    private static readonly string[] CrawlerUserAgents =
    [
        "twitterbot",
        "facebookexternalhit",
        "facebot",
        "linkedinbot",
        "slackbot",
        "discordbot",
        "telegrambot",
        "whatsapp",
    ];

    public static bool IsCrawler(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return false;

        return CrawlerUserAgents.Any(
            crawler => userAgent.Contains(crawler, StringComparison.OrdinalIgnoreCase));
    }
}
