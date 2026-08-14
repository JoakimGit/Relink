import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { HomePage } from './home';
import { LinkService } from '../services/link-service';
import { GroupService } from '../services/group-service';
import { ToastService } from '../../../shared/services/toast.service';
import { Link } from '../types/link';
import { of } from 'rxjs';

const mockLinks: Link[] = [
    {
        id: 'abc123',
        title: 'Example Docs',
        longUrl: 'https://example.com/very-long-url-that-should-be-truncated',
        createdAt: '2025-03-20T08:00:00Z',
        notes: 'Example link',
        startDate: '2025-06-01T00:00:00Z',
        expirationDate: '2025-12-31T23:59:59Z',
        passwordHash: 'hash123',
        maxVisits: 100,
        visitCount: 42,
        isLocked: true,
        group: null,
        metadata: {
            id: 1,
            shortenedLinkId: 'abc123',
            title: 'Example Page Title',
            description: 'A description of the page',
            imageUrl: 'https://example.com/og-image.png',
            siteName: 'Example Site',
            lastScrapedAt: '2025-06-15T12:00:00Z',
        },
    },
    {
        id: 'xyz789',
        title: 'Another Site',
        longUrl: 'https://another-site.com/page',
        createdAt: '2025-01-15T10:30:00Z',
        notes: null,
        startDate: null,
        expirationDate: null,
        passwordHash: null,
        maxVisits: null,
        visitCount: 5,
        isLocked: false,
        group: { id: 1, name: 'Work' },
        metadata: null,
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

function createMockGroupService() {
    const groupsData = signal([
        { id: 1, name: 'Work' },
        { id: 2, name: 'Empty' },
    ]);
    return {
        groupsResource: {
            hasValue: () => true,
            value: () => groupsData(),
            isLoading: () => false,
            error: () => null as Error | null,
            reload: vi.fn(),
        },
        createGroup: vi.fn((name: string) => {
            const created = { id: groupsData().length + 1, name };
            groupsData.update((g) => [...g, created]);
            return of(created);
        }),
        renameGroup: vi.fn().mockReturnValue(of({ id: 1, name: 'Renamed' })),
        deleteGroup: vi.fn().mockReturnValue(of(undefined)),
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
                { provide: GroupService, useValue: createMockGroupService() },
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

        it('renders a sort dropdown next to the search input', async () => {
            await fixture.whenStable();
            const select = nativeElement.querySelector('[data-testid="sort-dropdown"]');
            expect(select).toBeTruthy();
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

        it('displays the Title as the most prominent text on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            const title = card!.querySelector('[data-testid="link-card-title"]');
            expect(title).toBeTruthy();
            expect(title!.textContent).toContain('Example Docs');
        });

        it('does not display the Short Code on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            expect(card!.textContent).not.toContain('abc123');
        });

        it('displays the domain on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            const domain = card!.querySelector('[data-testid="link-card-domain"]');
            expect(domain!.textContent).toContain('example.com');
        });

        it('displays Visit Count on each card', async () => {
            await fixture.whenStable();
            const card = nativeElement.querySelector('[data-testid="link-card"]');
            expect(card!.textContent).toContain('42');
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

        it('shows date indicators when link has start or expiration date', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards[0].querySelector('[data-testid="start-date-indicator"]')).toBeTruthy();
            expect(cards[0].querySelector('[data-testid="expiration-date-indicator"]')).toBeTruthy();
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
            expect(cards[0].textContent).toContain('Example Docs');
        });

        it('filters cards by Long URL', async () => {
            component.searchQuery.set('another-site');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('Another Site');
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
            component.searchQuery.set('EXAMPLE');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('Example Docs');
        });

        it('filters cards by Title', async () => {
            component.searchQuery.set('Another');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('Another Site');
        });
    });

    describe('group filtering', () => {
        beforeEach(() => {
            setUp();
        });

        it('lists All Links, every Group with its count, and Uncategorized', async () => {
            await fixture.whenStable();
            const pills = Array.from(
                nativeElement.querySelectorAll('[data-testid="group-pill"]'),
            ).map((p) => p.textContent);

            expect(pills[0]).toContain('All Links');
            expect(pills[0]).toContain('2');
            expect(pills[1]).toContain('Work');
            expect(pills[1]).toContain('1');
            expect(pills[2]).toContain('Empty');
            expect(pills[2]).toContain('0');
            expect(pills[3]).toContain('Uncategorized');
            expect(pills[3]).toContain('1');
        });

        it('filters the grid to a Group when its pill is selected', async () => {
            await fixture.whenStable();
            const pills = nativeElement.querySelectorAll('[data-testid="group-pill"]');
            (pills[1] as HTMLElement).click();
            await fixture.whenStable();

            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('Another Site');
        });

        it('filters the grid to Uncategorized links when that pill is selected', async () => {
            await fixture.whenStable();
            const pills = nativeElement.querySelectorAll('[data-testid="group-pill"]');
            (pills[3] as HTMLElement).click();
            await fixture.whenStable();

            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(1);
            expect(cards[0].textContent).toContain('Example Docs');
        });

        it('shows all links again when All Links is selected', async () => {
            await fixture.whenStable();
            const pills = nativeElement.querySelectorAll('[data-testid="group-pill"]');
            (pills[3] as HTMLElement).click();
            await fixture.whenStable();
            (pills[0] as HTMLElement).click();
            await fixture.whenStable();

            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards.length).toBe(2);
        });
    });

    describe('sorting', () => {
        beforeEach(() => {
            setUp();
        });

        it('sorts newest first by default', async () => {
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards[0].textContent).toContain('Example Docs');
        });

        it('sorts oldest first when selected', async () => {
            component.sortOrder.set('oldest');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards[0].textContent).toContain('Another Site');
        });

        it('sorts most visited first when selected', async () => {
            component.sortOrder.set('mostVisited');
            await fixture.whenStable();
            const cards = nativeElement.querySelectorAll('[data-testid="link-card"]');
            expect(cards[0].textContent).toContain('Example Docs');
        });

        it('sorts alphabetically by Title when selected', async () => {
            component.sortOrder.set('titleAsc');
            await fixture.whenStable();
            const titles = Array.from(
                nativeElement.querySelectorAll('[data-testid="link-card-title"]'),
            ).map((t) => t.textContent?.trim());
            expect(titles).toEqual(['Another Site', 'Example Docs']);
        });
    });

    describe('manage groups', () => {
        beforeEach(() => {
            setUp();
        });

        it('renders a Manage Groups button', async () => {
            await fixture.whenStable();
            const button = nativeElement.querySelector('[data-testid="manage-groups-trigger"]');
            expect(button).toBeTruthy();
            expect(button!.textContent).toContain('Manage Groups');
        });

        it('shows a Group created in the modal in the pill bar', async () => {
            await fixture.whenStable();

            (nativeElement.querySelector('[data-testid="manage-groups-trigger"]') as HTMLElement).click();
            await fixture.whenStable();

            const input = document.body.querySelector('[data-testid="new-group-input"]') as HTMLInputElement;
            input.value = 'Finance';
            input.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            (document.body.querySelector('[data-testid="new-group-create"]') as HTMLElement).click();
            await fixture.whenStable();

            const pills = Array.from(nativeElement.querySelectorAll('[data-testid="group-pill"]')).map(
                (p) => p.textContent,
            );
            expect(pills.some((p) => p!.includes('Finance'))).toBe(true);
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
