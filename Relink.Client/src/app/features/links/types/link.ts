export type Tag = {
    id: number;
    name: string;
};

export type Group = {
    id: number;
    name: string;
};

export type LinkMetadata = {
    id: number;
    shortenedLinkId: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    siteName: string | null;
    lastScrapedAt: string | null;
};

export type Link = {
    id: string;
    title: string;
    longUrl: string;
    createdAt: string;
    notes: string | null;
    startDate: string | null;
    expirationDate: string | null;
    passwordHash: string | null;
    maxVisits: number | null;
    visitCount: number;
    isLocked: boolean;

    tags?: Array<Tag>;
    metadata?: LinkMetadata | null;
    group?: Group | null;
    groupId?: number | null;
};

export type CreateLinkRequest = {
    longUrl: string;
    title: string;
    preferedShortCode?: string;
    notes?: string;
    startDate?: string;
    expirationDate?: string;
    password?: string;
    maxVisits?: number;
    tags?: string[];
    groupId?: number;
};

export type CreateLinkResponse = {
    shortCode: string;
    title: string;
};

export type UpdateLinkRequest = {
    longUrl: string;
    title: string;
    preferedShortCode?: string;
    notes?: string;
    startDate?: string | null;
    expirationDate?: string | null;
    password?: string | null;
    maxVisits?: number | null;
    tags?: string[];
    groupId?: number;
};

export type ScrapeMetadataResponse = Pick<LinkMetadata, 'title' | 'description' | 'imageUrl' | 'siteName'> & { lastScrapedAt: string };

export type VisitBucket = {
    start: string;
    end: string;
    count: number;
};

export type ReferrerCount = {
    referrer: string;
    count: number;
};

export type BrowserCount = {
    browser: string;
    count: number;
};

export type AnalyticsResponse = {
    visitCounts: Array<VisitBucket>;
    topReferrers: Array<ReferrerCount>;
    browserBreakdown: Array<BrowserCount>;
};

export type UnlockResponse = {
    longUrl: string;
};