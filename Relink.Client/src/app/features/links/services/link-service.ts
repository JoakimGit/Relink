import { httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Link, CreateLinkRequest, CreateLinkResponse, UpdateLinkRequest, UnlockResponse, Tag, ScrapeMetadataResponse, AnalyticsResponse } from '../types/link';

@Service()
export class LinkService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'https://localhost:7445/api';
    readonly redirectBaseUrl = 'https://localhost:7445';

    readonly linksResource = httpResource<Array<Link>>(() => `${this.apiUrl}/links`);

    readonly tagsResource = httpResource<Array<Tag>>(() => `${this.apiUrl}/tags`);

    createLink(request: CreateLinkRequest) {
        return this.http.post<CreateLinkResponse>(`${this.apiUrl}/links`, request);
    }

    updateLink(id: string, request: UpdateLinkRequest) {
        return this.http.patch<void>(`${this.apiUrl}/links/${id}`, request);
    }

    deleteLink(id: string) {
        return this.http.delete<void>(`${this.apiUrl}/links/${id}`);
    }

    unlockLink(shortcode: string, password: string) {
        return this.http.post<UnlockResponse>(`${this.apiUrl}/links/${shortcode}/unlock`, { password });
    }

    scrapeMetadata(id: string) {
        return this.http.post<ScrapeMetadataResponse>(`${this.apiUrl}/links/${id}/scrape-metadata`, null);
    }

    getAnalytics(id: string) {
        return this.http.get<AnalyticsResponse>(`${this.apiUrl}/links/${id}/analytics`);
    }

    resetVisitCount(id: string) {
        return this.http.post<void>(`${this.apiUrl}/links/${id}/reset-visit-count`, null);
    }
}