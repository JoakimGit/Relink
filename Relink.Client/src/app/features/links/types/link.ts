export type Tag = {
    id: number;
    name: string;
};

export type Link = {
    id: string;
    longUrl: string;
    createdAt: string;
    notes: string | null;
    fallbackUrl: string | null;
    startDate: string | null;
    expirationDate: string | null;
    passwordHash: string | null;
    maxVisits: number | null;
    visitCount: number;
    isLocked: boolean;

    tags?: Array<Tag>;
};

export type CreateLinkRequest = {
    longUrl: string;
    preferedShortCode?: string;
    notes?: string;
    fallbackUrl?: string;
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
    fallbackUrl?: string;
    startDate?: string | null;
    expirationDate?: string | null;
    password?: string | null;
    maxVisits?: number | null;
    tags?: string[];
};

export type UnlockResponse = {
    longUrl: string;
    fallbackUrl: string | null;
};