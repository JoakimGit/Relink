export type Tag = {
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
};

export type CreateLinkRequest = {
    longUrl: string;
    preferedShortCode?: string;
    notes?: string;
    startDate?: string;
    expirationDate?: string;
    password?: string;
    maxVisits?: number;
    tags?: string[];
};

export type CreateLinkResponse = {
    shortCode: string;
};

export type UpdateLinkRequest = {
    longUrl: string;
    preferedShortCode?: string;
    notes?: string;
    startDate?: string | null;
    expirationDate?: string | null;
    password?: string | null;
    maxVisits?: number | null;
    tags?: string[];
};

export type ScrapeMetadataResponse = Pick<LinkMetadata, 'title' | 'description' | 'imageUrl' | 'siteName'> & { lastScrapedAt: string };

export type UnlockResponse = {
    longUrl: string;
};