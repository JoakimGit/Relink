import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
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
    metadata: null,
};

const maxedOutLink: Link = {
    ...constrainedLink,
    maxVisits: 10,
    visitCount: 10,
};

function createMockLinkService() {
    return {
        redirectBaseUrl: 'https://localhost:7445',
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

    it('renders a globe indicator when Link Metadata exists', async () => {
        setUp();
        await fixture.whenStable();

        const globe = nativeElement.querySelector('[data-testid="globe-indicator"]');
        expect(globe).toBeTruthy();
    });

    it('does not render a globe indicator when Link Metadata is missing', async () => {
        setUp(plainLink);
        await fixture.whenStable();

        const globe = nativeElement.querySelector('[data-testid="globe-indicator"]');
        expect(globe).toBeFalsy();
    });

    it('renders the Visit Count', async () => {
        setUp();
        await fixture.whenStable();

        const visitCount = nativeElement.querySelector('[data-testid="visit-count"]');
        expect(visitCount).toBeTruthy();
        expect(visitCount!.textContent).toContain('42');
    });

    it('renders constraint indicators when constraints exist', async () => {
        setUp();
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="lock-icon"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="password-icon"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="start-date-indicator"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="expiration-date-indicator"]')).toBeTruthy();
        expect(nativeElement.querySelector('[data-testid="max-visits-indicator"]')).toBeTruthy();
    });

    it('does not render constraint indicators when no constraints exist', async () => {
        setUp(plainLink);
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="lock-icon"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="password-icon"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="start-date-indicator"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="expiration-date-indicator"]')).toBeFalsy();
        expect(nativeElement.querySelector('[data-testid="max-visits-indicator"]')).toBeFalsy();
    });

    it('shows the Max Visits gauge with current Visits over the cap', async () => {
        setUp();
        await fixture.whenStable();

        const indicator = nativeElement.querySelector('[data-testid="max-visits-indicator"]');
        expect(indicator).toBeTruthy();
        expect(indicator!.textContent).toContain('42/100');
        expect(indicator!.classList.contains('text-destructive')).toBe(false);
    });

    it('styles the Max Visits indicator destructively when the cap is reached', async () => {
        setUp(maxedOutLink);
        await fixture.whenStable();

        const indicator = nativeElement.querySelector('[data-testid="max-visits-indicator"]');
        expect(indicator!.classList.contains('text-destructive')).toBe(true);
    });

    it('shows no Max Visits indicator when the Link has no cap', async () => {
        setUp(plainLink);
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="max-visits-indicator"]')).toBeFalsy();
    });

    it('labels the Start Date indicator with "Starts {date}"', async () => {
        setUp();
        await fixture.whenStable();

        const indicator = nativeElement.querySelector('[data-testid="start-date-indicator"]');
        expect(indicator!.getAttribute('title')).toMatch(/^Starts \d{2}\.\d{2}\.\d{4}$/);
        expect(indicator!.getAttribute('aria-label')).toMatch(/^Starts \d{2}\.\d{2}\.\d{4}$/);
    });

    it('labels the Expiration Date indicator with "Expires {date}"', async () => {
        setUp();
        await fixture.whenStable();

        const indicator = nativeElement.querySelector('[data-testid="expiration-date-indicator"]');
        expect(indicator!.getAttribute('title')).toMatch(/^Expires \d{2}\.\d{2}\.\d{4}$/);
        expect(indicator!.getAttribute('aria-label')).toMatch(/^Expires \d{2}\.\d{2}\.\d{4}$/);
    });

    it('does not render the combined "Date restricted" indicator', async () => {
        setUp();
        await fixture.whenStable();

        expect(nativeElement.querySelector('[data-testid="calendar-icon"]')).toBeFalsy();
    });

    it('renders the actions menu trigger', async () => {
        setUp();
        await fixture.whenStable();

        const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]');
        expect(trigger).toBeTruthy();
    });
});
