import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { LinkCard } from './link-card';
import { LinkService } from '../services/link-service';
import { ToastService } from '../../../shared/services/toast.service';
import type { Link } from '../types/link';

const constrainedLink: Link = {
    id: 'abc123',
    title: 'Example Docs',
    longUrl: 'https://example.com/very/long/path',
    createdAt: '2025-01-15T10:30:00Z',
    notes: 'Example link',
    startDate: '2025-06-01T00:00:00Z',
    expirationDate: '2025-12-31T23:59:59Z',
    passwordHash: 'hash123',
    maxVisits: 100,
    visitCount: 42,
    isLocked: true,
    tags: [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Important' },
    ],
    metadata: {
        id: 1,
        shortenedLinkId: 'abc123',
        title: 'Scraped Page Title',
        description: 'A description of the page',
        imageUrl: 'https://example.com/og-image.png',
        siteName: 'Example Site',
        lastScrapedAt: '2025-06-15T12:00:00Z',
    },
};

const plainLink: Link = {
    id: 'xyz789',
    title: 'Another Site',
    longUrl: 'https://another-site.com/page',
    createdAt: '2025-03-20T08:00:00Z',
    notes: null,
    startDate: null,
    expirationDate: null,
    passwordHash: null,
    maxVisits: null,
    visitCount: 5,
    isLocked: false,
    tags: [{ id: 3, name: 'Personal' }],
    metadata: null,
};

function createMockLinkService() {
    return {
        redirectBaseUrl: 'https://localhost:7445',
        scrapeMetadata: vi.fn().mockReturnValue(
            of({ title: 'Test', description: null, imageUrl: null, siteName: null, lastScrapedAt: '' }),
        ),
    };
}

function createMockToastService() {
    return {
        toasts: signal([]),
        show: vi.fn(),
    };
}

describe('LinkCard', () => {
    let fixture: ComponentFixture<LinkCard>;
    let nativeElement: HTMLElement;

    function setUp(link: Link = constrainedLink) {
        TestBed.configureTestingModule({
            imports: [LinkCard],
            providers: [
                { provide: LinkService, useValue: createMockLinkService() },
                { provide: ToastService, useValue: createMockToastService() },
            ],
        });

        fixture = TestBed.createComponent(LinkCard);
        fixture.componentRef.setInput('link', link);
        nativeElement = fixture.nativeElement;
    }

    it('renders the Title as the primary text', async () => {
        setUp();
        await fixture.whenStable();

        const title = nativeElement.querySelector('[data-testid="link-card-title"]');
        expect(title).toBeTruthy();
        expect(title!.tagName.toLowerCase()).toBe('h3');
        expect(title!.textContent).toContain('Example Docs');
    });

    it('renders the domain of the Long URL', async () => {
        setUp();
        await fixture.whenStable();

        const domain = nativeElement.querySelector('[data-testid="link-card-domain"]');
        expect(domain).toBeTruthy();
        expect(domain!.textContent).toContain('example.com');
    });

    it('does not display the Short Code on the card', async () => {
        setUp();
        await fixture.whenStable();

        expect(nativeElement.textContent).not.toContain('abc123');
    });

    it('renders a favicon when Link Metadata exists', async () => {
        setUp();
        await fixture.whenStable();

        const favicon = nativeElement.querySelector('[data-testid="favicon"]');
        expect(favicon).toBeTruthy();
        expect(favicon!.getAttribute('src')).toBe(
            'https://www.google.com/s2/favicons?domain=example.com&sz=32',
        );
    });

    it('does not render a favicon when Link Metadata is missing', async () => {
        setUp(plainLink);
        await fixture.whenStable();

        const favicon = nativeElement.querySelector('[data-testid="favicon"]');
        expect(favicon).toBeFalsy();
    });

    it('renders the Visit Count', async () => {
        setUp();
        await fixture.whenStable();

        const visitCount = nativeElement.querySelector('[data-testid="visit-count"]');
        expect(visitCount).toBeTruthy();
        expect(visitCount!.textContent).toContain('42');
    });

    it('renders constraint icons when constraints exist', async () => {
        setUp();
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="lock-icon"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="password-icon"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="calendar-icon"]')).toBeTruthy();
    });

    it('does not render constraint icons when no constraints exist', async () => {
        setUp(plainLink);
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="lock-icon"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="password-icon"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="calendar-icon"]')).toBeFalsy();
    });

    it('renders Tags as chips', async () => {
        setUp();
        await fixture.whenStable();

        const tags = nativeElement.querySelectorAll('[data-testid="tag-chip"]');
        expect(tags.length).toBe(2);
        expect(tags[0].textContent).toContain('Work');
        expect(tags[1].textContent).toContain('Important');
    });

    it('renders the actions menu trigger', async () => {
        setUp();
        await fixture.whenStable();

        const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]');
        expect(trigger).toBeTruthy();
    });
});
