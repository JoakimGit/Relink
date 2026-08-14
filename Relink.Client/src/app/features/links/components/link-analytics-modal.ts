import { Component, computed, inject, output, resource, signal, viewChild } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Button } from '../../../shared/components/ui/button/button';
import { Dialog } from '../../../shared/components/ui/dialog/dialog';
import { DialogContent } from '../../../shared/components/ui/dialog/dialog-content';
import { DialogDescription } from '../../../shared/components/ui/dialog/dialog-description';
import { DialogFooter } from '../../../shared/components/ui/dialog/dialog-footer';
import { DialogHeader } from '../../../shared/components/ui/dialog/dialog-header';
import { DialogPortal } from '../../../shared/components/ui/dialog/dialog-portal';
import { DialogTitle } from '../../../shared/components/ui/dialog/dialog-title';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBarChart3, lucideGlobe, lucideLoader, lucideMonitor, lucideRotateCcw } from '@ng-icons/lucide';
import { LinkService } from '../services/link-service';
import { ToastService } from '../../../shared/services/toast.service';
import type { Link, VisitBucket } from '../types/link';

@Component({
    selector: 'app-link-analytics-modal',
    imports: [
        Button,
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogPortal,
        DialogTitle,
        ConfirmDialog,
        NgIcon,
    ],
    viewProviders: [
        provideIcons({
            lucideBarChart3,
            lucideGlobe,
            lucideLoader,
            lucideMonitor,
            lucideRotateCcw,
        }),
    ],
    template: `
        <app-dialog [state]="dialogState()" (closed)="onClosed()">
            <app-dialog-content *appDialogPortal="let ctx" class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <app-dialog-header>
                    <h3 appDialogTitle class="flex items-center gap-2">
                        <ng-icon name="lucideBarChart3" class="text-muted-foreground" />
                        Analytics
                    </h3>
                    <p appDialogDescription>
                        @if (activeLink()) {
                            {{ activeLink()!.title }} — Visit activity
                        }
                    </p>
                </app-dialog-header>

                @if (isLoading()) {
                    <div data-testid="analytics-loading" class="flex items-center justify-center py-12">
                        <ng-icon name="lucideLoader" class="animate-spin text-muted-foreground" />
                        <span class="sr-only">Loading analytics</span>
                    </div>
                } @else if (loadError()) {
                    <p data-testid="analytics-error" class="text-sm text-destructive">
                        Failed to load analytics.
                    </p>
                } @else if (analytics()) {
                    @let data = analytics()!;

                    <!-- Visit chart -->
                    <section>
                        <h4 class="text-sm font-medium text-foreground mb-2">Visits over time</h4>
                        <div
                            data-testid="analytics-chart"
                            role="img"
                            [attr.aria-label]="chartAriaLabel()"
                        >
                            <div class="flex items-end gap-px h-40 border-b border-border">
                                @for (bucket of data.visitCounts; track bucket.start) {
                                    <div
                                        class="flex-1 min-w-0 rounded-t-sm"
                                        [class.bg-primary]="bucket.count > 0"
                                        [class.bg-muted]="bucket.count === 0"
                                        [style.height.%]="barHeightPercent(bucket.count)"
                                        [title]="bucketTooltip(bucket)"
                                    ></div>
                                }
                            </div>
                            <div class="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                <span>{{ firstBucketLabel() }}</span>
                                <span>Last 30 days · daily</span>
                                <span>{{ lastBucketLabel() }}</span>
                            </div>
                        </div>
                    </section>

                    <!-- Top referrers -->
                    <section>
                        <h4 class="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <ng-icon name="lucideGlobe" class="text-muted-foreground" />
                            Top referrers
                        </h4>
                        @if (data.topReferrers.length > 0) {
                            <ul data-testid="referrers-list" class="divide-y divide-border rounded-lg border border-border">
                                @for (ref of data.topReferrers; track ref.referrer) {
                                    <li class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                        <span class="truncate">{{ ref.referrer }}</span>
                                        <span class="text-muted-foreground shrink-0">{{ ref.count }}</span>
                                    </li>
                                }
                            </ul>
                        } @else {
                            <p data-testid="referrers-empty" class="text-sm text-muted-foreground">
                                No referrers recorded yet.
                            </p>
                        }
                    </section>

                    <!-- Browser breakdown -->
                    <section>
                        <h4 class="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <ng-icon name="lucideMonitor" class="text-muted-foreground" />
                            Browsers
                        </h4>
                        @if (data.browserBreakdown.length > 0) {
                            <ul data-testid="browser-list" class="divide-y divide-border rounded-lg border border-border">
                                @for (b of data.browserBreakdown; track b.browser) {
                                    <li class="px-3 py-2 text-sm">
                                        <div class="flex items-center justify-between mb-1.5">
                                            <span>{{ b.browser }}</span>
                                            <span class="text-muted-foreground">{{ b.count }}</span>
                                        </div>
                                        <div class="h-1.5 w-full rounded-full bg-muted">
                                            <div
                                                class="h-1.5 rounded-full bg-primary"
                                                [style.width.%]="sharePercent(b.count)"
                                            ></div>
                                        </div>
                                    </li>
                                }
                            </ul>
                        } @else {
                            <p data-testid="browser-empty" class="text-sm text-muted-foreground">
                                No browser data recorded yet.
                            </p>
                        }
                    </section>
                }

                <app-dialog-footer>
                    <button appBtn variant="outline" type="button" appDialogClose>Close</button>
                    <button
                        appBtn
                        variant="destructive"
                        type="button"
                        data-testid="reset-visit-count"
                        [disabled]="!activeLink() || isLoading() || isResetting()"
                        (click)="openResetConfirm()"
                    >
                        @if (isResetting()) {
                            <ng-icon name="lucideLoader" class="mr-1 text-sm animate-spin" />
                        } @else {
                            <ng-icon name="lucideRotateCcw" class="mr-1 text-sm" />
                        }
                        Reset Visit Count
                    </button>
                </app-dialog-footer>
            </app-dialog-content>
        </app-dialog>

        <app-confirm-dialog
            title="Reset Visit Count"
            [message]="resetMessage()"
            confirmLabel="Reset"
            (confirmed)="onResetConfirmed()"
        />
    `,
})
export class LinkAnalyticsModal {
    private readonly linkService = inject(LinkService);
    private readonly toastService = inject(ToastService);

    /** Emits the Short Code of the Link whose Visit Count was reset. */
    readonly visitCountReset = output<string>();

    readonly dialogState = signal<'open' | 'closed'>('closed');
    readonly activeLink = signal<Link | null>(null);
    readonly isResetting = signal(false);

    readonly analyticsResource = resource({
        params: () => this.activeLink()?.id,
        loader: ({ params }) => lastValueFrom(this.linkService.getAnalytics(params)),
    });

    readonly isLoading = this.analyticsResource.isLoading;
    readonly analytics = computed(() => this.analyticsResource.value() ?? null);
    readonly loadError = computed(() => this.analyticsResource.error() != null);

    readonly resetConfirmDialog = viewChild.required(ConfirmDialog);

    readonly maxBucketCount = computed(() => {
        const counts = this.analytics()?.visitCounts.map((b) => b.count) ?? [];
        return Math.max(1, ...counts);
    });

    readonly totalBrowserCount = computed(() =>
        (this.analytics()?.browserBreakdown ?? []).reduce((sum, b) => sum + b.count, 0),
    );

    readonly chartAriaLabel = computed(() => {
        const data = this.analytics();
        if (!data) return 'Visit chart';
        return `Visit chart with ${data.visitCounts.length} daily buckets covering the last 30 days.`;
    });

    readonly firstBucketLabel = computed(() => {
        const counts = this.analytics()?.visitCounts ?? [];
        return counts.length > 0 ? this.bucketLabel(counts[0]) : '';
    });

    readonly lastBucketLabel = computed(() => {
        const counts = this.analytics()?.visitCounts ?? [];
        return counts.length > 0 ? this.bucketLabel(counts[counts.length - 1]) : '';
    });

    readonly resetMessage = computed(() => {
        const link = this.activeLink();
        return link
            ? `This will reset the Visit Count for "${link.title}" to zero and erase its analytics history. This action cannot be undone.`
            : '';
    });

    open(link: Link): void {
        const sameLink = this.activeLink()?.id === link.id;
        this.activeLink.set(link);
        this.dialogState.set('open');

        // The resource refetches on request change; force a refetch when
        // reopening the same Link so the data is always fresh.
        if (sameLink) {
            this.analyticsResource.reload();
        }
    }

    onClosed(): void {
        this.dialogState.set('closed');
    }

    openResetConfirm(): void {
        this.resetConfirmDialog().open();
    }

    onResetConfirmed(): void {
        const link = this.activeLink();
        if (!link) return;

        this.isResetting.set(true);
        this.linkService.resetVisitCount(link.id).subscribe({
            next: () => {
                this.isResetting.set(false);
                this.toastService.show('Visit Count reset.');
                this.visitCountReset.emit(link.id);
                this.analyticsResource.reload();
                this.resetConfirmDialog().close();
            },
            error: () => {
                this.isResetting.set(false);
                this.toastService.show('Failed to reset Visit Count.');
                this.resetConfirmDialog().close();
            },
        });
    }

    barHeightPercent(count: number): number {
        if (count === 0) return 2;
        return (count / this.maxBucketCount()) * 100;
    }

    sharePercent(count: number): number {
        const total = this.totalBrowserCount();
        return total === 0 ? 0 : (count / total) * 100;
    }

    bucketTooltip(bucket: VisitBucket): string {
        const noun = bucket.count === 1 ? 'visit' : 'visits';
        return `${bucket.count} ${noun} — ${this.bucketLabel(bucket)}`;
    }

    private bucketLabel(bucket: VisitBucket): string {
        const start = new Date(bucket.start);
        return `${String(start.getUTCDate()).padStart(2, '0')}.${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
    }
}
