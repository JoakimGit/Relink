import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LinkCardActions } from './link-card-actions';
import { ToastService } from '../../../shared/services/toast.service';
import { LinkService } from '../services/link-service';
import type { Link } from '../types/link';

const mockLink: Link = {
    id: 'abc123',
    longUrl: 'https://example.com/very-long-url',
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
};

function createMockLinkService() {
    return {
        redirectBaseUrl: 'https://localhost:7445',
        scrapeMetadata: vi.fn().mockReturnValue(of({ title: 'Test', description: null, imageUrl: null, siteName: null, lastScrapedAt: '' })),
    };
}

function createMockToastService() {
    return {
        toasts: signal([]),
        show: vi.fn(),
    };
}

describe('LinkCardActions', () => {
    let component: LinkCardActions;
    let fixture: ComponentFixture<LinkCardActions>;
    let nativeElement: HTMLElement;
    let mockToastService: ReturnType<typeof createMockToastService>;

    function setUp() {
        mockToastService = createMockToastService();

        TestBed.configureTestingModule({
            imports: [LinkCardActions],
            providers: [
                { provide: ToastService, useValue: mockToastService },
                { provide: LinkService, useValue: createMockLinkService() },
            ],
        });

        fixture = TestBed.createComponent(LinkCardActions);
        // Set the required input via componentRef
        fixture.componentRef.setInput('link', mockLink);
        component = fixture.componentInstance;
        nativeElement = fixture.nativeElement;
    }

    describe('initial render', () => {
        beforeEach(() => {
            setUp();
        });

        it('renders an ellipsis button', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]');
            expect(trigger).toBeTruthy();
            expect(trigger!.getAttribute('aria-haspopup')).toBe('true');
        });

        it('does not show the menu initially', async () => {
            await fixture.whenStable();
            const menu = nativeElement.querySelector('[data-testid="card-actions-menu"]');
            expect(menu).toBeFalsy();
        });
    });

    describe('menu toggle', () => {
        beforeEach(() => {
            setUp();
        });

        it('opens the menu when the ellipsis button is clicked', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const menu = nativeElement.querySelector('[data-testid="card-actions-menu"]');
            expect(menu).toBeTruthy();
        });

        it('closes the menu when the ellipsis button is clicked again', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;

            // Open
            trigger.click();
            await fixture.whenStable();
            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeTruthy();

            // Close
            trigger.click();
            await fixture.whenStable();
            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });

        it('shows Copy, Edit, and Delete action buttons in the menu', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const copyBtn = nativeElement.querySelector('[data-testid="action-copy"]');
            const editBtn = nativeElement.querySelector('[data-testid="action-edit"]');
            const deleteBtn = nativeElement.querySelector('[data-testid="action-delete"]');

            expect(copyBtn).toBeTruthy();
            expect(copyBtn!.textContent).toContain('Copy');
            expect(editBtn).toBeTruthy();
            expect(editBtn!.textContent).toContain('Edit');
            expect(deleteBtn).toBeTruthy();
            expect(deleteBtn!.textContent).toContain('Delete');
        });
    });

    describe('copy action', () => {
        let writeTextSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
            setUp();
        });

        afterEach(() => {
            writeTextSpy.mockRestore();
        });

        it('copies the full shortened URL to clipboard when Copy is clicked', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const copyBtn = nativeElement.querySelector('[data-testid="action-copy"]') as HTMLElement;
            copyBtn.click();
            await fixture.whenStable();

            expect(writeTextSpy).toHaveBeenCalledWith('https://localhost:7445/abc123');
        });

        it('shows a "Copied!" toast after copying', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const copyBtn = nativeElement.querySelector('[data-testid="action-copy"]') as HTMLElement;
            copyBtn.click();
            await fixture.whenStable();

            expect(mockToastService.show).toHaveBeenCalledWith('Copied!');
        });

        it('closes the menu after copy', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const copyBtn = nativeElement.querySelector('[data-testid="action-copy"]') as HTMLElement;
            copyBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });
    });

    describe('edit action', () => {
        beforeEach(() => {
            setUp();
        });

        it('emits editRequested with the link when Edit is clicked', async () => {
            const editSpy = vi.fn();
            component.editRequested.subscribe(editSpy);

            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const editBtn = nativeElement.querySelector('[data-testid="action-edit"]') as HTMLElement;
            editBtn.click();
            await fixture.whenStable();

            expect(editSpy).toHaveBeenCalledWith(mockLink);
        });

        it('closes the menu after edit', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const editBtn = nativeElement.querySelector('[data-testid="action-edit"]') as HTMLElement;
            editBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });
    });

    describe('delete action', () => {
        beforeEach(() => {
            setUp();
        });

        it('emits deleteRequested with the link when Delete is clicked', async () => {
            const deleteSpy = vi.fn();
            component.deleteRequested.subscribe(deleteSpy);

            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const deleteBtn = nativeElement.querySelector('[data-testid="action-delete"]') as HTMLElement;
            deleteBtn.click();
            await fixture.whenStable();

            expect(deleteSpy).toHaveBeenCalledWith(mockLink);
        });

        it('closes the menu after delete', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const deleteBtn = nativeElement.querySelector('[data-testid="action-delete"]') as HTMLElement;
            deleteBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });
    });

    describe('scrape action', () => {
        let mockLinkService: ReturnType<typeof createMockLinkService>;
        let mockToastService: ReturnType<typeof createMockToastService>;

        beforeEach(() => {
            mockLinkService = createMockLinkService();
            mockToastService = createMockToastService();

            TestBed.configureTestingModule({
                imports: [LinkCardActions],
                providers: [
                    { provide: ToastService, useValue: mockToastService },
                    { provide: LinkService, useValue: mockLinkService },
                ],
            });

            fixture = TestBed.createComponent(LinkCardActions);
            fixture.componentRef.setInput('link', mockLink);
            component = fixture.componentInstance;
            nativeElement = fixture.nativeElement;
        });

        async function openMenuAndGetScrapeButton(): Promise<HTMLElement> {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();
            return nativeElement.querySelector('[data-testid="action-scrape"]') as HTMLElement;
        }

        it('shows a "Scrape Metadata" button in the menu', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            expect(scrapeBtn).toBeTruthy();
            expect(scrapeBtn.textContent).toContain('Scrape Metadata');
        });

        it('calls scrapeMetadata on the service when clicked', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(mockLinkService.scrapeMetadata).toHaveBeenCalledWith('abc123');
        });

        it('emits metadataScraped event after successful scrape', async () => {
            const scrapeSpy = vi.fn();
            component.metadataScraped.subscribe(scrapeSpy);

            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(scrapeSpy).toHaveBeenCalledWith('abc123');
        });

        it('shows a success toast when scraping completes', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(mockToastService.show).toHaveBeenCalledWith('Metadata scraped!');
        });

        it('closes the menu after successful scrape', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });

        it('sets isScraping to true while request is pending', async () => {
            // Simulate a pending request that doesn't complete
            mockLinkService.scrapeMetadata = vi.fn().mockReturnValue({
                subscribe: vi.fn(),
            });

            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(component.isScraping()).toBe(true);
        });
    });

    describe('scrape action failure', () => {
        let mockToastService: ReturnType<typeof createMockToastService>;

        beforeEach(() => {
            mockToastService = createMockToastService();
            const failService = createMockLinkService();
            failService.scrapeMetadata = vi.fn().mockReturnValue(throwError(() => new Error('Scrape failed')));

            TestBed.configureTestingModule({
                imports: [LinkCardActions],
                providers: [
                    { provide: ToastService, useValue: mockToastService },
                    { provide: LinkService, useValue: failService },
                ],
            });

            fixture = TestBed.createComponent(LinkCardActions);
            fixture.componentRef.setInput('link', mockLink);
            component = fixture.componentInstance;
            nativeElement = fixture.nativeElement;
        });

        async function openMenuAndGetScrapeButton(): Promise<HTMLElement> {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();
            return nativeElement.querySelector('[data-testid="action-scrape"]') as HTMLElement;
        }

        it('shows an error toast when scraping fails', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(mockToastService.show).toHaveBeenCalledWith('Failed to scrape metadata.');
        });

        it('resets isScraping to false after failed scrape', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(component.isScraping()).toBe(false);
        });

        it('closes the menu after failed scrape', async () => {
            const scrapeBtn = await openMenuAndGetScrapeButton();
            scrapeBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });
    });
});
