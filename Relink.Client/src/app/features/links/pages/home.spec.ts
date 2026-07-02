import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HomePage } from './home';
import { LinkService } from '../services/link-service';
import { Link } from '../types/link';

const mockLinks: Link[] = [
    {
        id: 'abc123',
        longUrl: 'https://example.com/very-long-url-that-should-be-truncated',
        createdAt: '2025-01-15T10:30:00Z',
        notes: 'Example link',
        fallbackUrl: null,
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
    },
    {
        id: 'xyz789',
        longUrl: 'https://another-site.com/page',
        createdAt: '2025-03-20T08:00:00Z',
        notes: null,
        fallbackUrl: 'https://fallback.example.com',
        startDate: null,
        expirationDate: null,
        passwordHash: null,
        maxVisits: null,
        visitCount: 5,
        isLocked: false,
        tags: [{ id: 3, name: 'Personal' }],
    },
];

function createMockLinkService(links: Link[]) {
    const data = signal(links);
    return {
        linksResource: {
            hasValue: () => true,
            value: () => data(),
            isLoading: () => false,
            error: () => null as Error | null,
        },
    };
}

describe('HomePage', () => {
    let component: HomePage;
    let fixture: ComponentFixture<HomePage>;
    let nativeElement: HTMLElement;

    function setUp(links: Link[] = mockLinks) {
        TestBed.configureTestingModule({
            imports: [HomePage],
            providers: [
                { provide: LinkService, useValue: createMockLinkService(links) },
            ],
        });

        fixture = TestBed.createComponent(HomePage);
        component = fixture.componentInstance;
        nativeElement = fixture.nativeElement;
    }

    describe('initial render', () => {
        beforeEach(() => {
            setUp();
        });

        it('renders the ReLink brand header', async () => {
            await fixture.whenStable();
            const header = nativeElement.querySelector('header');
            expect(header).toBeTruthy();
            expect(header!.textContent).toContain('ReLink');
        });

        it('renders a search input', async () => {
            await fixture.whenStable();
            const input = nativeElement.querySelector('input[type="search"]');
            expect(input).toBeTruthy();
        });

        it('renders a create new Link button', async () => {
            await fixture.whenStable();
            const button = nativeElement.querySelector('button');
            expect(button).toBeTruthy();
            expect(button!.textContent).toContain('Create');
        });

        it('renders link cards for each link', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(2);
        });

        it('displays Short Code on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            expect(card!.textContent).toContain('abc123');
        });

        it('displays Long URL on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            expect(card!.textContent).toContain('https://example.com/very-long-url');
        });

        it('displays Visit Count on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            expect(card!.textContent).toContain('42');
        });

        it('displays Tags as chips on each card', async () => {
            await fixture.whenStable();
            const tags = nativeElement.querySelectorAll('[data-testid="tag-chip"]');
            expect(tags.length).toBe(3);
            expect(tags[0].textContent).toContain('Work');
            expect(tags[1].textContent).toContain('Important');
            expect(tags[2].textContent).toContain('Personal');
        });

        it('shows lock icon when link is locked', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            const lockIcon = cards[0].querySelector('[data-testid="lock-icon"]');
            expect(lockIcon).toBeTruthy();
        });

        it('does not show lock icon when link is not locked', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            const lockIcon = cards[1].querySelector('[data-testid="lock-icon"]');
            expect(lockIcon).toBeFalsy();
        });

        it('shows password icon when link has password lock', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            const passwordIcon = cards[0].querySelector('[data-testid="password-icon"]');
            expect(passwordIcon).toBeTruthy();
        });

        it('shows calendar icon when link has start or expiration date', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            const calendarIcon = cards[0].querySelector('[data-testid="calendar-icon"]');
            expect(calendarIcon).toBeTruthy();
        });
    });

    describe('empty state', () => {
        beforeEach(() => {
            setUp([]);
        });

        it('shows empty state message when no links exist', async () => {
            await fixture.whenStable();
            const emptyState = nativeElement.querySelector('[data-testid="empty-state"]');
            expect(emptyState).toBeTruthy();
            expect(emptyState!.textContent).toContain('No links');
        });

        it('does not render link cards when no links exist', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(0);
        });
    });

    describe('search filtering', () => {
        beforeEach(() => {
            setUp();
        });

        it('filters cards by Short Code', async () => {
            // ACT: type a search query
            component.searchQuery.set('abc');
            // WAIT for zoneless change detection
            await fixture.whenStable();
            // ASSERT
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('abc123');
        });

        it('filters cards by Long URL', async () => {
            component.searchQuery.set('another-site');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('xyz789');
        });

        it('filters cards by Tag name', async () => {
            component.searchQuery.set('Personal');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('xyz789');
        });

        it('shows all cards when search is empty', async () => {
            component.searchQuery.set('abc');
            await fixture.whenStable();
            // ACT: clear search
            component.searchQuery.set('');
            // WAIT
            await fixture.whenStable();
            // ASSERT
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(2);
        });

        it('shows no cards when search matches nothing', async () => {
            component.searchQuery.set('nonexistent');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(0);
        });

        it('is case-insensitive', async () => {
            component.searchQuery.set('WORK');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('abc123');
        });
    });
});
