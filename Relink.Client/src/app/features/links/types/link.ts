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

    tags?: Array<{ id: number; name: string }>;
}