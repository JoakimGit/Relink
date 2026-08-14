import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LinkAnalyticsModal } from './link-analytics-modal';
import { LinkService } from '../services/link-service';
import { ToastService } from '../../../shared/services/toast.service';
import type { AnalyticsResponse, Link, VisitBucket } from '../types/link';

const mockLink: Link = {
    id: 'abc123',
    title: 'Example Docs',
    longUrl: 'https://example.com/very/long/path',
    createdAt: '2025-01-15T10:30:00Z',
    notes: 'Example link',
    startDate: null,
    expirationDate: null,
    passwordHash: null,
    maxVisits: null,
    visitCount: 42,
    isLocked: false,
    metadata: null,
};

function dayBucket(startIso: string, count: number): VisitBucket {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString(), count };
}

const analyticsFixture: AnalyticsResponse = {
    visitCounts: [
        dayBucket('2025-06-15T00:00:00Z', 2),
        dayBucket('2025-06-14T00:00:00Z', 3),
        dayBucket('2025-06-13T00:00:00Z', 0),
    ],
    topReferrers: [
        { referrer: 'https://example.com/source', count: 4 },
        { referrer: 'Direct', count: 3 },
    ],
    browserBreakdown: [
        { browser: 'Chrome', count: 5 },
        { browser: 'Safari', count: 2 },
    ],
};

function createMockLinkService() {
    return {
        getAnalytics: vi.fn().mockReturnValue(of(analyticsFixture)),
        resetVisitCount: vi.fn().mockReturnValue(of(undefined)),
    };
}

function createMockToastService() {
    return {
        toasts: signal([]),
        show: vi.fn(),
    };
}

describe('LinkAnalyticsModal', () => {
    let component: LinkAnalyticsModal;
    let fixture: ComponentFixture<LinkAnalyticsModal>;
    let mockLinkService: ReturnType<typeof createMockLinkService>;
    let mockToastService: ReturnType<typeof createMockToastService>;

    function setUp() {
        mockLinkService = createMockLinkService();
        mockToastService = createMockToastService();

        TestBed.configureTestingModule({
            imports: [LinkAnalyticsModal],
            providers: [
                { provide: LinkService, useValue: mockLinkService },
                { provide: ToastService, useValue: mockToastService },
            ],
        });

        fixture = TestBed.createComponent(LinkAnalyticsModal);
        component = fixture.componentInstance;
    }

    function openModal(): void {
        component.open(mockLink);
    }

    function barTitles(): string[] {
        const bars = document.body.querySelectorAll('[data-testid="analytics-chart"] div[title]');
        return Array.from(bars).map((b) => b.getAttribute('title') ?? '');
    }

    describe('when opened', () => {
        beforeEach(async () => {
            setUp();
            openModal();
            await fixture.whenStable();
        });

        it('fetches analytics for the link', () => {
            expect(mockLinkService.getAnalytics).toHaveBeenCalledWith('abc123');
        });

        it('renders the visit chart, referrers, and browser breakdown', () => {
            expect(document.body.querySelector('[data-testid="analytics-chart"]')).toBeTruthy();
            expect(document.body.querySelector('[data-testid="referrers-list"]')).toBeTruthy();
            expect(document.body.querySelector('[data-testid="browser-list"]')).toBeTruthy();
        });

        it('renders daily buckets with a dd.MM label', () => {
            expect(barTitles().some((t) => /^3 visits — \d{2}\.\d{2}$/.test(t))).toBe(true);
        });

        it('renders zero-count days', () => {
            expect(barTitles().some((t) => /^0 visits — \d{2}\.\d{2}$/.test(t))).toBe(true);
        });

        it('captions the chart as daily buckets', () => {
            const chart = document.body.querySelector('[data-testid="analytics-chart"]');
            expect(chart!.textContent).toContain('Last 30 days · daily');
        });

        it('labels the chart for screen readers', () => {
            const chart = document.body.querySelector('[data-testid="analytics-chart"]');
            expect(chart!.getAttribute('role')).toBe('img');
            expect(chart!.getAttribute('aria-label')).toContain('daily');
        });

        it('lists top referrers with counts', () => {
            const list = document.body.querySelector('[data-testid="referrers-list"]');
            expect(list!.textContent).toContain('https://example.com/source');
            expect(list!.textContent).toContain('4');
        });

        it('lists the browser breakdown with counts', () => {
            const list = document.body.querySelector('[data-testid="browser-list"]');
            expect(list!.textContent).toContain('Chrome');
            expect(list!.textContent).toContain('5');
        });
    });

    describe('reset Visit Count', () => {
        beforeEach(async () => {
            setUp();
            openModal();
            await fixture.whenStable();
        });

        it('asks for confirmation before resetting', async () => {
            const resetButton = document.body.querySelector('[data-testid="reset-visit-count"]') as HTMLElement;
            resetButton.click();
            await fixture.whenStable();

            const confirmButton = document.body.querySelector('[data-testid="confirm-dialog-confirm"]');
            expect(confirmButton).toBeTruthy();
            expect(document.body.textContent).toContain('erase its analytics history');
            expect(mockLinkService.resetVisitCount).not.toHaveBeenCalled();
        });

        it('resets the Visit Count and emits when confirmed', async () => {
            const resetSpy = vi.fn();
            component.visitCountReset.subscribe(resetSpy);

            const resetButton = document.body.querySelector('[data-testid="reset-visit-count"]') as HTMLElement;
            resetButton.click();
            await fixture.whenStable();

            const confirmButton = document.body.querySelector('[data-testid="confirm-dialog-confirm"]') as HTMLElement;
            confirmButton.click();
            await fixture.whenStable();

            expect(mockLinkService.resetVisitCount).toHaveBeenCalledWith('abc123');
            expect(resetSpy).toHaveBeenCalledWith('abc123');
            expect(mockToastService.show).toHaveBeenCalledWith('Visit Count reset.');
        });
    });

    describe('when analytics fail to load', () => {
        beforeEach(async () => {
            setUp();
            mockLinkService.getAnalytics = vi.fn().mockReturnValue(
                throwError(() => new Error('Failed')),
            );
            openModal();
            await fixture.whenStable();
        });

        it('shows an error message', () => {
            expect(document.body.querySelector('[data-testid="analytics-error"]')).toBeTruthy();
        });
    });
});
