import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { LinkFormModal } from './link-form-modal';
import { LinkService } from '../services/link-service';
import { GroupService } from '../services/group-service';
import type { Link, CreateLinkRequest, UpdateLinkRequest } from '../types/link';
import { of } from 'rxjs';

const mockLink: Link = {
    id: 'abc123',
    title: 'Example Link',
    longUrl: 'https://example.com/original-url',
    createdAt: '2025-01-15T10:30:00Z',
    notes: 'Example notes',
    startDate: '2025-06-01T00:00:00Z',
    expirationDate: '2025-12-31T23:59:59Z',
    passwordHash: 'hash123',
    maxVisits: 100,
    visitCount: 42,
    isLocked: false,
    group: { id: 1, name: 'Work' },
    metadata: {
        id: 1,
        shortenedLinkId: 'abc123',
        title: 'Scraped Page Title',
        description: 'A scraped description of the page',
        imageUrl: 'https://example.com/scraped-image.png',
        siteName: 'Example Site',
        lastScrapedAt: '2025-06-15T12:00:00Z',
    },
};

function createMockLinkService() {
    const linksData = signal([]);
    return {
        linksResource: {
            hasValue: () => true,
            value: () => linksData(),
            isLoading: () => false,
            error: () => null as Error | null,
            reload: vi.fn(),
        },
        createLink: vi.fn().mockReturnValue(of({ shortCode: 'abc123' })),
        updateLink: vi.fn().mockReturnValue(of(undefined)),
        deleteLink: vi.fn().mockReturnValue(of(undefined)),
    };
}

function createMockGroupService() {
    const groupsData = signal([
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' },
    ]);
    return {
        groupsResource: {
            hasValue: () => true,
            value: () => groupsData(),
            isLoading: () => false,
            error: () => null as Error | null,
            reload: vi.fn(),
        },
        createGroup: vi.fn().mockImplementation((name: string) => {
            const group = { id: 3, name };
            groupsData.update((groups) => [...groups, group]);
            return of(group);
        }),
        renameGroup: vi.fn().mockReturnValue(of({ id: 1, name: 'Renamed' })),
        deleteGroup: vi.fn().mockReturnValue(of(undefined)),
    };
}

describe('LinkFormModal', () => {
    let component: LinkFormModal;
    let fixture: ComponentFixture<LinkFormModal>;
    let nativeElement: HTMLElement;
    let mockLinkService: ReturnType<typeof createMockLinkService>;
    let mockGroupService: ReturnType<typeof createMockGroupService>;

    function setUp() {
        mockLinkService = createMockLinkService();
        mockGroupService = createMockGroupService();

        TestBed.configureTestingModule({
            imports: [LinkFormModal],
            providers: [
                { provide: LinkService, useValue: mockLinkService },
                { provide: GroupService, useValue: mockGroupService },
            ],
        });

        fixture = TestBed.createComponent(LinkFormModal);
        component = fixture.componentInstance;
        nativeElement = fixture.nativeElement;
    }

    function openCreateDialog() {
        const trigger = nativeElement.querySelector('button') as HTMLButtonElement;
        trigger.click();
    }

    function openEditDialog(link: Link = mockLink) {
        fixture.componentRef.setInput('link', link);
    }

    /** Query input inside the portaled dialog (rendered in document.body). */
    function queryInput(name: string): HTMLInputElement | null {
        return document.body.querySelector(`input[name="${name}"]`);
    }

    function fillValidLongUrl() {
        const longUrlInput = queryInput('longUrl')!;
        longUrlInput.value = 'https://example.com/test';
        longUrlInput.dispatchEvent(new Event('input'));
    }

    function fillValidTitle() {
        const titleInput = queryInput('title')!;
        titleInput.value = 'My Link';
        titleInput.dispatchEvent(new Event('input'));
    }

    // ─── Create mode ────────────────────────────────────────────

    describe('create mode - initial render', () => {
        beforeEach(() => {
            setUp();
        });

        it('renders a create button with Plus icon', async () => {
            await fixture.whenStable();
            const button = nativeElement.querySelector('button');
            expect(button).toBeTruthy();
            expect(button!.textContent).toContain('Create');
        });

        it('opens the dialog when clicking the create button', async () => {
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();

            const dialogTitle = document.body.querySelector('[appDialogTitle]');
            expect(dialogTitle).toBeTruthy();
            expect(dialogTitle!.textContent).toContain('Create Link');
        });
    });

    describe('create mode - form fields', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('has all expected form fields', () => {
            expect(queryInput('title')).toBeTruthy();
            expect(queryInput('longUrl')).toBeTruthy();
            expect(queryInput('preferredShortCode')).toBeTruthy();
            expect(document.body.querySelector('textarea[name="notes"]')).toBeTruthy();
            expect(queryInput('startDate')!.type).toBe('date');
            expect(queryInput('expirationDate')!.type).toBe('date');
            expect(queryInput('password')!.type).toBe('password');
            expect(queryInput('maxVisits')!.type).toBe('number');
        });

        it('has Cancel and Create Link buttons in the footer', () => {
            const footer = document.body.querySelector('app-dialog-footer');
            const buttons = footer!.querySelectorAll('button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
            expect(buttonTexts).toContain('Cancel');
            expect(buttonTexts).toContain('Create Link');
        });
    });

    describe('create mode - validation', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('disables submit when Long URL is empty', async () => {
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.focus();
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            const submitBtn = document.body.querySelector('[data-testid="submit-button"]') as HTMLButtonElement;
            expect(submitBtn.disabled).toBe(true);
        });

        it('shows error for invalid URL format', async () => {
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.value = 'not-a-valid-url';
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            const errorElement = document.body.querySelector('p.text-destructive');
            expect(errorElement).toBeTruthy();
            expect(errorElement!.textContent).toContain('valid URL');
        });

        it('disables submit when Title is empty', async () => {
            component.longUrl.set('https://example.com/test');
            component.title.set('');
            component.titleTouched.set(true);
            await fixture.whenStable();

            const submitBtn = document.body.querySelector('[data-testid="submit-button"]') as HTMLButtonElement;
            expect(submitBtn.disabled).toBe(true);
        });

        it('shows error when Title exceeds 60 characters', async () => {
            component.longUrl.set('https://example.com/test');
            component.title.set('x'.repeat(61));
            component.titleTouched.set(true);
            await fixture.whenStable();

            const errorElement = Array.from(document.body.querySelectorAll('p.text-destructive')).find(
                (el) => el.textContent?.includes('60 characters'),
            );
            expect(errorElement).toBeTruthy();
        });
    });

    describe('create mode - submission', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('calls createLink with correct payload', async () => {
            fillValidTitle();
            fillValidLongUrl();

            const preferredCodeInput = queryInput('preferredShortCode')!;
            preferredCodeInput.value = 'mycode';
            preferredCodeInput.dispatchEvent(new Event('input'));

            const notesTextarea = document.body.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
            notesTextarea.value = 'Test notes';
            notesTextarea.dispatchEvent(new Event('input'));

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            const payload: CreateLinkRequest = mockLinkService.createLink.mock.calls[0][0];
            expect(payload.title).toBe('My Link');
            expect(payload.longUrl).toBe('https://example.com/test');
            expect(payload.preferedShortCode).toBe('mycode');
            expect(payload.notes).toBe('Test notes');
        });

        it('emits linkSaved on success', async () => {
            const emitted = vi.fn();
            component.linkSaved.subscribe(emitted);

            fillValidTitle();
            fillValidLongUrl();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(emitted).toHaveBeenCalled();
        });
    });

    describe('create mode - group assignment', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('shows a Group select defaulting to Uncategorized', () => {
            const select = document.body.querySelector('[data-testid="group-select"]') as HTMLSelectElement;
            expect(select).toBeTruthy();
            expect(select.value).toBe('');
            expect(select.options[0].textContent).toContain('Uncategorized');
        });

        it('lists existing Groups in the select', () => {
            const select = document.body.querySelector('[data-testid="group-select"]') as HTMLSelectElement;
            const labels = Array.from(select.options).map((o) => o.textContent?.trim());
            expect(labels).toContain('Work');
            expect(labels).toContain('Personal');
        });

        it('creates a new Group inline and selects it', async () => {
            const toggle = document.body.querySelector('[data-testid="new-group-toggle"]') as HTMLElement;
            toggle.click();
            await fixture.whenStable();

            const input = document.body.querySelector('[data-testid="new-group-input"]') as HTMLInputElement;
            input.value = 'New Group';
            input.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            const add = document.body.querySelector('[data-testid="new-group-create"]') as HTMLElement;
            add.click();
            await fixture.whenStable();

            expect(mockGroupService.createGroup).toHaveBeenCalledWith('New Group');
            const select = document.body.querySelector('[data-testid="group-select"]') as HTMLSelectElement;
            expect(select.value).toBe('3');
        });

        it('includes groupId in the create payload when a Group is selected', async () => {
            const select = document.body.querySelector('[data-testid="group-select"]') as HTMLSelectElement;
            select.value = '1';
            select.dispatchEvent(new Event('change'));
            await fixture.whenStable();

            fillValidTitle();
            fillValidLongUrl();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            const payload: CreateLinkRequest = mockLinkService.createLink.mock.calls[0][0];
            expect(payload.groupId).toBe(1);
        });
    });

    // ─── Edit mode ──────────────────────────────────────────────

    describe('edit mode', () => {
        beforeEach(() => {
            setUp();
        });

        it('does not show create trigger button when in edit mode', async () => {
            openEditDialog();
            await fixture.whenStable();

            const createBtn = nativeElement.querySelector('button');
            // The trigger button should not exist in edit mode (no trigger displayed in the host)
            expect(createBtn).toBeFalsy();
        });

        it('shows Edit Link title and pre-filled form', async () => {
            openEditDialog();
            await fixture.whenStable();

            const dialogTitle = document.body.querySelector('[appDialogTitle]');
            expect(dialogTitle!.textContent).toContain('Edit Link');

            const titleInput = queryInput('title')!;
            expect(titleInput.value).toBe('Example Link');

            const longUrlInput = queryInput('longUrl')!;
            expect(longUrlInput.value).toBe('https://example.com/original-url');

            const notesTextarea = document.body.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
            expect(notesTextarea.value).toBe('Example notes');
        });

        it('pre-fills the Group from the link', async () => {
            openEditDialog();
            await fixture.whenStable();

            const select = document.body.querySelector('[data-testid="group-select"]') as HTMLSelectElement;
            expect(select.value).toBe('1');
        });

        it('has Save Changes button (not Create Link)', async () => {
            openEditDialog();
            await fixture.whenStable();

            const submitBtn = document.body.querySelector('[data-testid="submit-button"]') as HTMLButtonElement;
            expect(submitBtn.textContent).toContain('Save Changes');
        });

        it('shows password hint about keeping current lock', async () => {
            openEditDialog();
            await fixture.whenStable();

            // The hint is the <p> with text about keeping current Password Lock
            const hint = Array.from(document.body.querySelectorAll('p')).find(
                (p) => p.textContent?.includes('Leave empty to keep current'),
            );
            expect(hint).toBeTruthy();
        });

        it('calls updateLink with correct payload, preserving password when empty', async () => {
            openEditDialog();
            await fixture.whenStable();
            await fixture.whenStable();

            // Manipulate signals directly — the form is pre-filled and valid
            component.longUrl.set('https://example.com/updated');

            await component.onSubmit(new Event('submit'));
            await fixture.whenStable();

            expect(mockLinkService.updateLink).toHaveBeenCalled();
            const payload: UpdateLinkRequest = mockLinkService.updateLink.mock.calls[0][1];
            expect(payload.title).toBe('Example Link');
            expect(payload.longUrl).toBe('https://example.com/updated');
            expect(payload.password).toBeUndefined(); // empty → not sent, preserves existing lock
        });

        it('emits linkSaved on successful update', async () => {
            const emitted = vi.fn();
            component.linkSaved.subscribe(emitted);

            openEditDialog();
            await fixture.whenStable();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(emitted).toHaveBeenCalled();
        });

        it('emits closed when dialog is dismissed', async () => {
            const emitted = vi.fn();
            component.closed.subscribe(emitted);

            openEditDialog();
            await fixture.whenStable();
            await fixture.whenStable();

            // Simulate dialog close by calling resetForm directly
            component.resetForm();

            expect(emitted).toHaveBeenCalled();
        });
    });

    describe('metadata display in edit mode', () => {
        beforeEach(() => {
            setUp();
        });

        function openEditDialog(): void {
            fixture.componentRef.setInput('link', mockLink);
        }

        it('does not show metadata section in create mode', async () => {
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            expect(metadataSection).toBeFalsy();
        });

        it('shows metadata section when editing a link with metadata', async () => {
            await fixture.whenStable();
            openEditDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            expect(metadataSection).toBeTruthy();
        });

        it('displays scraped title in metadata section', async () => {
            await fixture.whenStable();
            openEditDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            expect(metadataSection!.textContent).toContain('Scraped Page Title');
        });

        it('displays scraped description in metadata section', async () => {
            await fixture.whenStable();
            openEditDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            expect(metadataSection!.textContent).toContain('A scraped description of the page');
        });

        it('displays site name in metadata section', async () => {
            await fixture.whenStable();
            openEditDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            expect(metadataSection!.textContent).toContain('Example Site');
        });

        it('displays scraped image in metadata section', async () => {
            await fixture.whenStable();
            openEditDialog();
            await fixture.whenStable();

            const metadataSection = document.body.querySelector('[data-testid="metadata-section"]');
            const img = metadataSection!.querySelector('img');
            expect(img).toBeTruthy();
            expect(img!.getAttribute('src')).toBe('https://example.com/scraped-image.png');
        });
    });
});
