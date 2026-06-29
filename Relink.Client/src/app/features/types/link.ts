export type Link = {
    id: string;
    longUrl: string;
    createdAt: string;
    title: string | null;
    description: string | null;
    fallbackUrl: string | null;
    startDate: string | null;
    expirationDate: string | null;
    maxUsages: string | null;
    currentUsages: string | null;
    isLocked: boolean;

    tags?: Array<{ id: string; name: string }>;
}