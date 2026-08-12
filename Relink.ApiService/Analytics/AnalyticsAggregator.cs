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
    private const int HourlyBucketCount = 48;

    public static AnalyticsResponse Aggregate(IReadOnlyList<LinkAnalytics> visits, DateTime now)
    {
        // Hourly buckets: 48 one-hour buckets covering exactly the last 48 hours,
        // ending at `now`. Anything older than that window is bucketed by UTC day.
        var hourlyWindowStart = now.AddHours(-HourlyBucketCount);

        var hourly = new int[HourlyBucketCount];
        var daily = new Dictionary<DateTime, int>();
        var referrers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var browsers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var visit in visits)
        {
            var accessedAt = visit.AccessedAt;

            if (accessedAt < hourlyWindowStart)
            {
                var day = accessedAt.Date;
                daily[day] = daily.GetValueOrDefault(day) + 1;
            }
            else
            {
                var bucketIndex = (int)(accessedAt - hourlyWindowStart).TotalHours;
                hourly[Math.Clamp(bucketIndex, 0, HourlyBucketCount - 1)]++;
            }

            var referrer = string.IsNullOrWhiteSpace(visit.Referrer) ? "Direct" : visit.Referrer;
            referrers[referrer] = referrers.GetValueOrDefault(referrer) + 1;

            var browser = UserAgentParser.Parse(visit.UserAgent);
            browsers[browser] = browsers.GetValueOrDefault(browser) + 1;
        }

        var visitCounts = new List<VisitBucket>(HourlyBucketCount + daily.Count);

        for (var i = 0; i < HourlyBucketCount; i++)
        {
            var start = hourlyWindowStart.AddHours(i);
            visitCounts.Add(new VisitBucket(start, start.AddHours(1), hourly[i]));
        }

        foreach (var (day, count) in daily.OrderBy(kv => kv.Key))
        {
            visitCounts.Add(new VisitBucket(day, day.AddDays(1), count));
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
