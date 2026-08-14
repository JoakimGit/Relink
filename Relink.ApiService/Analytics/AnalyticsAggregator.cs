namespace Relink.ApiService.Analytics;

public record AnalyticsResponse(
    IReadOnlyList<VisitBucket> VisitCounts,
    IReadOnlyList<ReferrerCount> TopReferrers,
    IReadOnlyList<BrowserCount> BrowserBreakdown);

public record VisitBucket(DateTime Start, DateTime End, int Count);

public record ReferrerCount(string Referrer, int Count);

public record BrowserCount(string Browser, int Count);

public static class AnalyticsAggregator
{
    private const int DailyBucketCount = 30;

    public static AnalyticsResponse Aggregate(IReadOnlyList<LinkAnalytics> visits, DateTime now)
    {
        // Daily buckets: 30 one-day buckets covering exactly the last 30 days,
        // ending at the start of today (UTC). Zero-count days are included.
        var today = now.Date;
        var windowStart = today.AddDays(-(DailyBucketCount - 1));

        var daily = new int[DailyBucketCount];
        var referrers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var browsers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var visit in visits)
        {
            var accessedAt = visit.AccessedAt;

            if (accessedAt >= windowStart && accessedAt < today.AddDays(1))
            {
                var bucketIndex = (int)(accessedAt.Date - windowStart).TotalDays;
                daily[bucketIndex]++;
            }

            var referrer = string.IsNullOrWhiteSpace(visit.Referrer) ? "Direct" : visit.Referrer;
            referrers[referrer] = referrers.GetValueOrDefault(referrer) + 1;

            var browser = UserAgentParser.Parse(visit.UserAgent);
            browsers[browser] = browsers.GetValueOrDefault(browser) + 1;
        }

        var visitCounts = new List<VisitBucket>(DailyBucketCount);

        for (var i = 0; i < DailyBucketCount; i++)
        {
            var start = windowStart.AddDays(i);
            visitCounts.Add(new VisitBucket(start, start.AddDays(1), daily[i]));
        }

        var topReferrers = referrers
            .Select(kv => new ReferrerCount(kv.Key, kv.Value))
            .OrderByDescending(r => r.Count)
            .ThenBy(r => r.Referrer, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var browserBreakdown = browsers
            .Select(kv => new BrowserCount(kv.Key, kv.Value))
            .OrderByDescending(b => b.Count)
            .ThenBy(b => b.Browser, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new AnalyticsResponse(visitCounts, topReferrers, browserBreakdown);
    }
}
