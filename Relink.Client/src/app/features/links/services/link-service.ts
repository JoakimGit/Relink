import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { Link } from '../types/link';

@Service()
export class LinkService {
    readonly linksResource = httpResource<Array<Link>>(() => 'https://localhost:7445/api/links');
}