import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Link } from '../../types/link';

@Injectable({ providedIn: 'root' })
export class LinkService {
    readonly linksResource = httpResource<Array<Link>>(() => 'https://localhost:7445/api/links/urls');
}