export type Link = {
    id: string;
    longUrl: string;
    createdAt: string;
    notes: string | null;
    fallbackUrl: string | null;
    startDate: string | null;
    expirationDate: string | null;
    maxVisits: string | null;
    visitCount: string | null;
    isLocked: boolean;

    tags?: Array<{ id: string; name: string }>;
}