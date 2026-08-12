/**
 * Extracts the hostname (domain) from an absolute URL string.
 * Returns an empty string when the value is not a valid absolute URL.
 */
export function domainOf(url: string) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

/**
 * Builds a favicon image URL for a domain. Uses a public favicon
 * service because the Link Metadata scrape does not capture favicons.
 * Returns null when there is no domain to query.
 */
export function faviconUrlFor(domain: string) {
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}
