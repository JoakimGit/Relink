import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { HomePage } from './home';
import { LinkService } from '../services/link-service';
import { ToastService } from '../../../shared/services/toast.service';
import { Link } from '../types/link';
import { of } from 'rxjs';

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
            reload: vi.fn(),
        },
        tagsResource: {
            hasValue: () => true,
            value: () => [],
            isLoading: () => false,
            error: () => null as Error | null,
        },
        createLink: () => ({
            toPromise: () => Promise.resolve({ shortCode: 'test123' }),
        }),
        updateLink: vi.fn().mockReturnValue(of(undefined)),
        deleteLink: vi.fn().mockReturnValue(of(undefined)),
    };
}

function createMockToastService() {
    return {
        toasts: signal([]),
        show: vi.fn(),
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
                { provide: ToastService, useValue: createMockToastService() },
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

    describe('card actions menu', () => {
        beforeEach(() => {
            setUp();
        });

        it('renders an ellipsis actions trigger on each card', async () => {
            await fixture.whenStable();
            const triggers = nativeElement.querySelectorAll('[data-testid="card-actions-trigger"]');
            expect(triggers.length).toBe(2);
        });

        it('shows the actions menu when the ellipsis button is clicked', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const menu = nativeElement.querySelector('[data-testid="card-actions-menu"]');
            expect(menu).toBeTruthy();
            expect(menu!.textContent).toContain('Copy');
            expect(menu!.textContent).toContain('Edit');
            expect(menu!.textContent).toContain('Delete');
        });
    });

    describe('edit action', () => {
        beforeEach(() => {
            setUp();
        });

        it('opens the edit modal when Edit is clicked on a card', async () => {
            await fixture.whenStable();
            // The edit modal should initially be closed
            const editModal = nativeElement.querySelector('app-link-form-modal');
            expect(editModal).toBeTruthy();

            // Click the actions trigger on the first card
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            // Click Edit
            const editBtn = nativeElement.querySelector('[data-testid="action-edit"]') as HTMLElement;
            editBtn.click();
            await fixture.whenStable();

            // Wait for the setTimeout in openEditModal to flush
            await new Promise((r) => setTimeout(r, 0));
            await fixture.whenStable();

            // The linkToEdit should now be set to the first link
            expect(component.linkToEdit()).toEqual(mockLinks[0]);
        });
    });

    describe('delete confirmation', () => {
        beforeEach(() => {
            setUp();
        });

        it('shows the confirm dialog when Delete is clicked on a card', async () => {
            await fixture.whenStable();

            // Click the actions trigger on the first card
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            // Click Delete
            const deleteBtn = nativeElement.querySelector('[data-testid="action-delete"]') as HTMLElement;
            deleteBtn.click();
            await fixture.whenStable();

            // The linkToDelete should be set
            expect(component.linkToDelete()).toEqual(mockLinks[0]);
        });
    });
});
