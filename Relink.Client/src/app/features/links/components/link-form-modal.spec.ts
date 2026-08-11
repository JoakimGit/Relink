import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { LinkFormModal } from './link-form-modal';
import { LinkService } from '../services/link-service';
import type { Link, CreateLinkRequest, UpdateLinkRequest, Tag } from '../types/link';
import { of } from 'rxjs';

const mockTags: Tag[] = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Important' },
    { id: 3, name: 'Personal' },
    { id: 4, name: 'Blog' },
];

const mockLink: Link = {
    id: 'abc123',
    longUrl: 'https://example.com/original-url',
    createdAt: '2025-01-15T10:30:00Z',
    notes: 'Example notes',
    startDate: '2025-06-01T00:00:00Z',
    expirationDate: '2025-12-31T23:59:59Z',
    passwordHash: 'hash123',
    maxVisits: 100,
    visitCount: 42,
    isLocked: false,
    tags: [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Important' },
    ],
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
    const tagsData = signal(mockTags);
    const linksData = signal([]);
    return {
        linksResource: {
            hasValue: () => true,
            value: () => linksData(),
            isLoading: () => false,
            error: () => null as Error | null,
            reload: vi.fn(),
        },
        tagsResource: {
            hasValue: () => true,
            value: () => tagsData(),
            isLoading: () => false,
            error: () => null as Error | null,
        },
        createLink: vi.fn().mockReturnValue(of({ shortCode: 'abc123' })),
        updateLink: vi.fn().mockReturnValue(of(undefined)),
        deleteLink: vi.fn().mockReturnValue(of(undefined)),
    };
}

describe('LinkFormModal', () => {
    let component: LinkFormModal;
    let fixture: ComponentFixture<LinkFormModal>;
    let nativeElement: HTMLElement;
    let mockLinkService: ReturnType<typeof createMockLinkService>;

    function setUp() {
        mockLinkService = createMockLinkService();

        TestBed.configureTestingModule({
            imports: [LinkFormModal],
            providers: [
                { provide: LinkService, useValue: mockLinkService },
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
            expect(queryInput('longUrl')).toBeTruthy();
            expect(queryInput('preferredShortCode')).toBeTruthy();
            expect(document.body.querySelector('textarea[name="notes"]')).toBeTruthy();
            expect(queryInput('startDate')!.type).toBe('date');
            expect(queryInput('expirationDate')!.type).toBe('date');
            expect(queryInput('password')!.type).toBe('password');
            expect(queryInput('maxVisits')!.type).toBe('number');
            expect(queryInput('tagInput')).toBeTruthy();
        });

        it('has Cancel and Create Link buttons in the footer', () => {
            const footer = document.body.querySelector('app-dialog-footer');
            const buttons = footer!.querySelectorAll('button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
            expect(buttonTexts).toContain('Cancel');
            expect(buttonTexts).toContain('Create Link');
        });
    });

    describe('create mode - tag autocomplete', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('shows tag suggestions when typing', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.focus();
            tagInput.value = 'Wor';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new Event('focus'));
            await fixture.whenStable();

            const suggestions = document.body.querySelectorAll('[data-testid="tag-suggestion-item"]');
            expect(suggestions.length).toBeGreaterThan(0);
            const texts = Array.from(suggestions).map((s) => s.textContent?.trim());
            expect(texts).toContain('Work');
        });

        it('filters out already-selected tags from suggestions', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Work';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            tagInput.value = 'Wor';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new Event('focus'));
            await fixture.whenStable();

            const suggestions = document.body.querySelectorAll('[data-testid="tag-suggestion-item"]');
            const texts = Array.from(suggestions).map((s) => s.textContent?.trim());
            expect(texts).not.toContain('Work');
        });

        it('adds a tag chip when pressing Enter', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Personal';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            const chips = document.body.querySelectorAll('[data-testid="selected-tag-chip"]');
            expect(chips.length).toBe(1);
            expect(chips[0].textContent).toContain('Personal');
        });

        it('removes a tag when clicking X on a chip', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Blog';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            const removeBtn = document.body.querySelector('[data-testid="remove-tag"]') as HTMLButtonElement;
            removeBtn.click();
            await fixture.whenStable();

            const chips = document.body.querySelectorAll('[data-testid="selected-tag-chip"]');
            expect(chips.length).toBe(0);
        });

        it('removes last tag on Backspace when input is empty', async () => {
            const tagInput = queryInput('tagInput')!;

            tagInput.value = 'Tag1';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            tagInput.value = 'Tag2';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            tagInput.value = '';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            await fixture.whenStable();

            const chips = document.body.querySelectorAll('[data-testid="selected-tag-chip"]');
            expect(chips.length).toBe(1);
            expect(chips[0].textContent).toContain('Tag1');
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
    });

    describe('create mode - submission', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openCreateDialog();
            await fixture.whenStable();
        });

        it('calls createLink with correct payload', async () => {
            fillValidLongUrl();

            const preferredCodeInput = queryInput('preferredShortCode')!;
            preferredCodeInput.value = 'mycode';
            preferredCodeInput.dispatchEvent(new Event('input'));

            const notesTextarea = document.body.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
            notesTextarea.value = 'Test notes';
            notesTextarea.dispatchEvent(new Event('input'));

            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Work';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            await fixture.whenStable();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            const payload: CreateLinkRequest = mockLinkService.createLink.mock.calls[0][0];
            expect(payload.longUrl).toBe('https://example.com/test');
            expect(payload.preferedShortCode).toBe('mycode');
            expect(payload.notes).toBe('Test notes');
            expect(payload.tags).toEqual(['Work']);
        });

        it('emits linkSaved on success', async () => {
            const emitted = vi.fn();
            component.linkSaved.subscribe(emitted);

            fillValidLongUrl();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(emitted).toHaveBeenCalled();
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

            const longUrlInput = queryInput('longUrl')!;
            expect(longUrlInput.value).toBe('https://example.com/original-url');

            const notesTextarea = document.body.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
            expect(notesTextarea.value).toBe('Example notes');
        });

        it('pre-fills tags from the link', async () => {
            openEditDialog();
            await fixture.whenStable();

            const chips = document.body.querySelectorAll('[data-testid="selected-tag-chip"]');
            expect(chips.length).toBe(2);
            const texts = Array.from(chips).map((c) => c.textContent?.trim());
            expect(texts).toContain('Work');
            expect(texts).toContain('Important');
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
