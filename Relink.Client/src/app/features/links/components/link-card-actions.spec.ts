import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { LinkCardActions } from './link-card-actions';
import { ToastService } from '../../../shared/services/toast.service';
import { LinkService } from '../services/link-service';
import type { Link } from '../types/link';

const mockLink: Link = {
    id: 'abc123',
    title: 'Example Link',
    longUrl: 'https://example.com/very-long-url',
    createdAt: '2025-01-15T10:30:00Z',
    notes: 'Example link',
    startDate: '2025-06-01T00:00:00Z',
    expirationDate: '2025-12-31T23:59:59Z',
    passwordHash: 'hash123',
    maxVisits: 100,
    visitCount: 42,
    isLocked: true,
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

        it('closes the menu when Escape is pressed', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();
            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeTruthy();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
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

        it('shows an Analytics action button in the menu', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const analyticsBtn = nativeElement.querySelector('[data-testid="action-analytics"]');
            expect(analyticsBtn).toBeTruthy();
            expect(analyticsBtn!.textContent).toContain('Analytics');
        });

        it('does not show a "Scrape Metadata" action in the menu', async () => {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();

            const menu = nativeElement.querySelector('[data-testid="card-actions-menu"]');
            expect(menu).toBeTruthy();
            expect(menu!.querySelector('[data-testid="action-scrape"]')).toBeFalsy();
            expect(menu!.textContent).not.toContain('Scrape Metadata');
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

    describe('analytics action', () => {
        beforeEach(() => {
            setUp();
        });

        async function openMenuAndGetAnalyticsButton(): Promise<HTMLElement> {
            await fixture.whenStable();
            const trigger = nativeElement.querySelector('[data-testid="card-actions-trigger"]') as HTMLElement;
            trigger.click();
            await fixture.whenStable();
            return nativeElement.querySelector('[data-testid="action-analytics"]') as HTMLElement;
        }

        it('emits analyticsRequested with the link when Analytics is clicked', async () => {
            const analyticsSpy = vi.fn();
            component.analyticsRequested.subscribe(analyticsSpy);

            const analyticsBtn = await openMenuAndGetAnalyticsButton();
            analyticsBtn.click();
            await fixture.whenStable();

            expect(analyticsSpy).toHaveBeenCalledWith(mockLink);
        });

        it('closes the menu after Analytics is clicked', async () => {
            const analyticsBtn = await openMenuAndGetAnalyticsButton();
            analyticsBtn.click();
            await fixture.whenStable();

            expect(nativeElement.querySelector('[data-testid="card-actions-menu"]')).toBeFalsy();
        });
    });

});
