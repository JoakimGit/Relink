import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { CreateLinkModal } from './create-link-modal';
import { LinkService } from '../services/link-service';
import type { CreateLinkRequest, Tag } from '../types/link';

const mockTags: Tag[] = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Important' },
    { id: 3, name: 'Personal' },
    { id: 4, name: 'Blog' },
];

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
        createLink: vi.fn().mockReturnValue({
            toPromise: () => Promise.resolve({ shortCode: 'abc123' }),
        }),
    };
}

describe('CreateLinkModal', () => {
    let component: CreateLinkModal;
    let fixture: ComponentFixture<CreateLinkModal>;
    let nativeElement: HTMLElement;
    let mockLinkService: ReturnType<typeof createMockLinkService>;

    function setUp() {
        mockLinkService = createMockLinkService();

        TestBed.configureTestingModule({
            imports: [CreateLinkModal],
            providers: [
                { provide: LinkService, useValue: mockLinkService },
            ],
        });

        fixture = TestBed.createComponent(CreateLinkModal);
        component = fixture.componentInstance;
        nativeElement = fixture.nativeElement;
    }

    function openDialog() {
        // Click the trigger button to open the dialog
        const trigger = nativeElement.querySelector('button') as HTMLButtonElement;
        trigger.click();
    }

    /** Query input inside the portaled dialog (rendered in document.body). */
    function queryInput(name: string): HTMLInputElement | null {
        return document.body.querySelector(`input[name="${name}"]`);
    }

    /** Query element inside the portaled dialog. */
    function queryDialog(selector: string): Element | null {
        return document.body.querySelector(selector);
    }

    describe('initial render', () => {
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
            openDialog();
            await fixture.whenStable();

            // The dialog should now be visible (portaled to document.body)
            const dialogTitle = document.body.querySelector('[appDialogTitle]');
            expect(dialogTitle).toBeTruthy();
            expect(dialogTitle!.textContent).toContain('Create Link');
        });
    });

    describe('dialog form fields', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openDialog();
            await fixture.whenStable();
        });

        it('has a Long URL input that is required', () => {
            const input = queryInput('longUrl');
            expect(input).toBeTruthy();
            expect(input!.required).toBe(true);
            expect(input!.type).toBe('url');
        });

        it('has a Preferred Short Code input', () => {
            const input = queryInput('preferredShortCode');
            expect(input).toBeTruthy();
        });

        it('has a Notes textarea', () => {
            const textarea = document.body.querySelector('textarea[name="notes"]');
            expect(textarea).toBeTruthy();
        });

        it('has a Fallback URL input', () => {
            const input = queryInput('fallbackUrl');
            expect(input).toBeTruthy();
            expect(input!.type).toBe('url');
        });

        it('has Start Date and Expiration Date inputs', () => {
            const startDate = queryInput('startDate');
            const expirationDate = queryInput('expirationDate');
            expect(startDate).toBeTruthy();
            expect(startDate!.type).toBe('date');
            expect(expirationDate).toBeTruthy();
            expect(expirationDate!.type).toBe('date');
        });

        it('has a Password input', () => {
            const input = queryInput('password');
            expect(input).toBeTruthy();
            expect(input!.type).toBe('password');
        });

        it('has a Max Visits number input', () => {
            const input = queryInput('maxVisits');
            expect(input).toBeTruthy();
            expect(input!.type).toBe('number');
        });

        it('has a Tags input', () => {
            const input = queryInput('tagInput');
            expect(input).toBeTruthy();
        });

        it('has Cancel and Create Link buttons in the footer', () => {
            const footer = document.body.querySelector('app-dialog-footer');
            expect(footer).toBeTruthy();
            const buttons = footer!.querySelectorAll('button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
            expect(buttonTexts).toContain('Cancel');
            expect(buttonTexts).toContain('Create Link');
        });
    });

    describe('tag autocomplete', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openDialog();
            await fixture.whenStable();
        });

        it('shows tag suggestions when typing in the tag input', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.focus();
            tagInput.value = 'Wor';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new Event('focus'));
            await fixture.whenStable();

            const suggestions = document.body.querySelectorAll(
                '[data-testid="tag-suggestion-item"]',
            );
            expect(suggestions.length).toBeGreaterThan(0);
            const suggestionTexts = Array.from(suggestions).map((s) =>
                s.textContent?.trim(),
            );
            expect(suggestionTexts).toContain('Work');
        });

        it('filters out already-selected tags from suggestions', async () => {
            // First add "Work" tag
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Work';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            // Now type "Wor" again - "Work" should not appear
            tagInput.value = 'Wor';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(new Event('focus'));
            await fixture.whenStable();

            const suggestions = document.body.querySelectorAll(
                '[data-testid="tag-suggestion-item"]',
            );
            const suggestionTexts = Array.from(suggestions).map((s) =>
                s.textContent?.trim(),
            );
            expect(suggestionTexts).not.toContain('Work');
        });

        it('adds a tag as a chip when selecting a suggestion', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Personal';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            const chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(1);
            expect(chips[0].textContent).toContain('Personal');
        });

        it('removes a tag when clicking the X button on a chip', async () => {
            // Add a tag first
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Blog';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            let chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(1);

            // Click remove button
            const removeBtn = document.body.querySelector(
                '[data-testid="remove-tag"]',
            ) as HTMLButtonElement;
            removeBtn.click();
            await fixture.whenStable();

            chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(0);
        });

        it('creates a new tag by typing and pressing Enter', async () => {
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'NewTag';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            const chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(1);
            expect(chips[0].textContent).toContain('NewTag');
        });

        it('removes last tag on Backspace when input is empty', async () => {
            const tagInput = queryInput('tagInput')!;

            // Add two tags
            tagInput.value = 'Tag1';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            tagInput.value = 'Tag2';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            let chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(2);

            // Press Backspace with empty input
            tagInput.value = '';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Backspace' }),
            );
            await fixture.whenStable();

            chips = document.body.querySelectorAll(
                '[data-testid="selected-tag-chip"]',
            );
            expect(chips.length).toBe(1);
            expect(chips[0].textContent).toContain('Tag1');
        });
    });

    describe('validation', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openDialog();
            await fixture.whenStable();
        });

        it('shows an error when Long URL is empty and form is submitted', async () => {
            // Trigger validation by focusing and blurring the long URL field,
            // then check if the computed error shows
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.focus();
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            // The submit button should be disabled when form is invalid
            const submitBtn = document.body.querySelector(
                '[data-testid="submit-button"]',
            ) as HTMLButtonElement;
            expect(submitBtn.disabled).toBe(true);
        });

        it('shows validation error for invalid URL format', async () => {
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.value = 'not-a-valid-url';
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            // The error is a <p> element with class text-destructive, sibling to the input
            const errorElement =
                document.body.querySelector('p.text-destructive');
            expect(errorElement).toBeTruthy();
            expect(errorElement!.textContent).toContain('valid URL');
        });

        it('enables submit button when Long URL is valid', async () => {
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.value = 'https://example.com';
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            const submitBtn = document.body.querySelector(
                '[data-testid="submit-button"]',
            ) as HTMLButtonElement;
            expect(submitBtn.disabled).toBe(false);
        });
    });

    describe('form submission', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openDialog();
            await fixture.whenStable();
        });

        function fillValidForm() {
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.value = 'https://example.com/test';
            longUrlInput.dispatchEvent(new Event('input'));
        }

        it('calls createLink on LinkService with correct payload', async () => {
            fillValidForm();

            // Fill in other fields
            const preferredCodeInput = queryInput('preferredShortCode')!;
            preferredCodeInput.value = 'mycode';
            preferredCodeInput.dispatchEvent(new Event('input'));

            const notesTextarea = document.body.querySelector(
                'textarea[name="notes"]',
            ) as HTMLTextAreaElement;
            notesTextarea.value = 'Test notes';
            notesTextarea.dispatchEvent(new Event('input'));

            // Add a tag
            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Work';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            // Submit
            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(mockLinkService.createLink).toHaveBeenCalled();

            const payload: CreateLinkRequest =
                mockLinkService.createLink.mock.calls[0][0];
            expect(payload.longUrl).toBe('https://example.com/test');
            expect(payload.preferedShortCode).toBe('mycode');
            expect(payload.notes).toBe('Test notes');
            expect(payload.tags).toEqual(['Work']);
        });

        it('sends tag names (strings) not tag IDs', async () => {
            fillValidForm();

            const tagInput = queryInput('tagInput')!;
            tagInput.value = 'Work';
            tagInput.dispatchEvent(new Event('input'));
            tagInput.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter' }),
            );
            await fixture.whenStable();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            const payload: CreateLinkRequest =
                mockLinkService.createLink.mock.calls[0][0];
            expect(payload.tags).toEqual(['Work']);
            // Verify it's string array, not objects with IDs
            expect(typeof payload.tags![0]).toBe('string');
        });

        it('reloads linksResource on successful creation', async () => {
            fillValidForm();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(mockLinkService.linksResource.reload).toHaveBeenCalled();
        });

        it('emits linkCreated on successful creation', async () => {
            const emitted = vi.fn();
            component.linkCreated.subscribe(emitted);

            fillValidForm();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(emitted).toHaveBeenCalled();
        });

        it('shows error message when createLink fails', async () => {
            mockLinkService.createLink.mockReturnValue({
                toPromise: () =>
                    Promise.reject(new Error('Network error')),
            });

            fillValidForm();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            const errorElement = document.body.querySelector(
                '[data-testid="submit-error"]',
            );
            expect(errorElement).toBeTruthy();
            expect(errorElement!.textContent).toContain('Network error');
        });

        it('resets form after successful submission', async () => {
            fillValidForm();

            const form = document.body.querySelector('form')!;
            form.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            // After reset, longUrl signal should be empty
            expect(component.longUrl()).toBe('');
            expect(component.selectedTags()).toEqual([]);
            expect(component.submitError()).toBeNull();
        });
    });

    describe('dialog close behavior', () => {
        beforeEach(async () => {
            setUp();
            await fixture.whenStable();
            openDialog();
            await fixture.whenStable();
        });

        it('resets form when dialog is closed', async () => {
            // Fill in some fields
            const longUrlInput = queryInput('longUrl')!;
            longUrlInput.value = 'https://example.com';
            longUrlInput.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            // Close the dialog programmatically
            component.resetForm();
            await fixture.whenStable();

            // All fields should be reset
            expect(component.longUrl()).toBe('');
            expect(component.selectedTags()).toEqual([]);
            expect(component.submitError()).toBeNull();
        });
    });
});
