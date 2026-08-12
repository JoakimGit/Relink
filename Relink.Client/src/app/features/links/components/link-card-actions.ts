import { Component, inject, input, output, signal, ElementRef } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideEllipsisVertical,
    lucidePencil,
    lucideTrash2,
    lucideCopy,
    lucideChartColumn,
} from '@ng-icons/lucide';
import { Button } from '../../../shared/components/ui/button/button';
import { ToastService } from '../../../shared/services/toast.service';
import { LinkService } from '../services/link-service';
import type { Link } from '../types/link';

@Component({
    selector: 'app-link-card-actions',
    imports: [NgIcon, Button],
    host: {
        '(document:click)': 'onDocumentClick($event)',
        '(document:keydown)': 'onDocumentKeydown($event)',
    },
    viewProviders: [
        provideIcons({
            lucideEllipsisVertical,
            lucidePencil,
            lucideTrash2,
            lucideCopy,
            lucideChartColumn,
        }),
    ],
    template: `
        <div class="relative" (click)="$event.stopPropagation()">
            <button
                appBtn
                variant="ghost"
                size="icon-xs"
                data-testid="card-actions-trigger"
                (click)="toggleMenu()"
                [attr.aria-expanded]="isOpen()"
                aria-haspopup="true"
                [attr.aria-label]="'Actions for ' + link().title"
            >
                <ng-icon name="lucideEllipsisVertical" class="text-muted-foreground" />
            </button>

            @if (isOpen()) {
                <div
                    data-testid="card-actions-menu"
                    class="absolute right-0 top-full mt-1 z-30 w-44 rounded-md border border-border bg-popover shadow-lg py-1"
                >
                    <button
                        data-testid="action-copy"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        (click)="onCopy()"
                    >
                        <ng-icon name="lucideCopy" class="text-xs" />
                        Copy
                    </button>
                    <button
                        data-testid="action-edit"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        (click)="onEdit()"
                    >
                        <ng-icon name="lucidePencil" class="text-xs" />
                        Edit
                    </button>
                    <button
                        data-testid="action-analytics"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        (click)="onAnalytics()"
                    >
                        <ng-icon name="lucideChartColumn" class="text-xs" />
                        Analytics
                    </button>
                    <button
                        data-testid="action-delete"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        (click)="onDelete()"
                    >
                        <ng-icon name="lucideTrash2" class="text-xs" />
                        Delete
                    </button>
                </div>
            }
        </div>
    `,
})
export class LinkCardActions {
    readonly link = input.required<Link>();
    readonly editRequested = output<Link>();
    readonly deleteRequested = output<Link>();
    readonly analyticsRequested = output<Link>();

    private readonly toastService = inject(ToastService);
    private readonly linkService = inject(LinkService);
    private readonly elementRef = inject(ElementRef);

    readonly isOpen = signal(false);

    toggleMenu() {
        this.isOpen.update((v) => !v);
    }

    closeMenu() {
        this.isOpen.set(false);
    }

    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeMenu();
        }
    }

    onDocumentKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.closeMenu();
        }
    }

    onCopy() {
        const shortUrl = `${this.linkService.redirectBaseUrl}/${this.link().id}`;
        navigator.clipboard.writeText(shortUrl).then(() => {
            this.toastService.show('Copied!');
        }).catch(() => {
            // Fallback for environments where clipboard API is not available
            this.toastService.show('Failed to copy');
        });
        this.closeMenu();
    }

    onEdit() {
        this.editRequested.emit(this.link());
        this.closeMenu();
    }

    onAnalytics() {
        this.analyticsRequested.emit(this.link());
        this.closeMenu();
    }

    onDelete() {
        this.deleteRequested.emit(this.link());
        this.closeMenu();
    }
}
