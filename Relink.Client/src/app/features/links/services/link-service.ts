import { httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Link, CreateLinkRequest, CreateLinkResponse, Tag } from '../types/link';

@Service()
export class LinkService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'https://localhost:7445/api';

    readonly linksResource = httpResource<Array<Link>>(() => `${this.baseUrl}/links`);

    readonly tagsResource = httpResource<Array<Tag>>(() => `${this.baseUrl}/tags`);

    createLink(request: CreateLinkRequest) {
        return this.http.post<CreateLinkResponse>(`${this.baseUrl}/links`, request);
    }
}