import { Component, inject, input, output, signal, HostListener, ElementRef } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideEllipsisVertical,
    lucidePencil,
    lucideTrash2,
    lucideCopy,
    lucideGlobe,
    lucideLoader,
} from '@ng-icons/lucide';
import { Button } from '../../../shared/components/ui/button/button';
import { ToastService } from '../../../shared/services/toast.service';
import { LinkService } from '../services/link-service';
import type { Link } from '../types/link';

@Component({
    selector: 'app-link-card-actions',
    imports: [NgIcon, Button],
    viewProviders: [
        provideIcons({
            lucideEllipsisVertical,
            lucidePencil,
            lucideTrash2,
            lucideCopy,
            lucideGlobe,
            lucideLoader,
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
                [attr.aria-label]="'Actions for ' + link().id"
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
                        data-testid="action-scrape"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="isScraping()"
                        (click)="onScrape()"
                    >
                        @if (isScraping()) {
                            <ng-icon name="lucideLoader" class="text-xs animate-spin" />
                        } @else {
                            <ng-icon name="lucideGlobe" class="text-xs" />
                        }
                        {{ isScraping() ? 'Scraping...' : 'Scrape Metadata' }}
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
    readonly metadataScraped = output<string>();

    private readonly toastService = inject(ToastService);
    private readonly linkService = inject(LinkService);
    private readonly elementRef = inject(ElementRef);

    readonly isOpen = signal(false);
    readonly isScraping = signal(false);

    toggleMenu(): void {
        this.isOpen.update((v) => !v);
    }

    closeMenu(): void {
        this.isOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeMenu();
        }
    }

    onCopy(): void {
        const shortUrl = `${this.linkService.redirectBaseUrl}/${this.link().id}`;
        navigator.clipboard.writeText(shortUrl).then(() => {
            this.toastService.show('Copied!');
        }).catch(() => {
            // Fallback for environments where clipboard API is not available
            this.toastService.show('Failed to copy');
        });
        this.closeMenu();
    }

    onEdit(): void {
        this.editRequested.emit(this.link());
        this.closeMenu();
    }

    onScrape(): void {
        this.isScraping.set(true);
        this.linkService.scrapeMetadata(this.link().id).subscribe({
            next: () => {
                this.toastService.show('Metadata scraped!');
                this.isScraping.set(false);
                this.metadataScraped.emit(this.link().id);
                this.closeMenu();
            },
            error: () => {
                this.toastService.show('Failed to scrape metadata.');
                this.isScraping.set(false);
                this.closeMenu();
            },
        });
    }

    onDelete(): void {
        this.deleteRequested.emit(this.link());
        this.closeMenu();
    }
}
