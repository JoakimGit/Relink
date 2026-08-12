import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { LinkService } from "../services/link-service";
import { LinkFormModal } from "../components/link-form-modal";
import { LinkCard } from "../components/link-card";
import { ConfirmDialog } from "../../../shared/components/confirm-dialog";
import { ToastContainer } from "../../../shared/components/toast-container";
import { ToastService } from "../../../shared/services/toast.service";
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideSearch,
    lucideLink,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import type { Link } from "../types/link";

@Component({
    selector: "app-home-page",
    imports: [
        NgIcon,
        FormsModule,
        LinkFormModal,
        LinkCard,
        ConfirmDialog,
        ToastContainer,
    ],
    viewProviders: [provideIcons({
        lucideSearch,
        lucideLink,
    })],
    template: `
    <div class="min-h-screen">
        <!-- Header -->
        <header class="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <ng-icon name="lucideLink" class="text-primary text-xl" />
                    <h1 class="text-xl font-semibold tracking-tight">ReLink</h1>
                </div>
                <app-link-form-modal (linkSaved)="linksResource.reload()" />
            </div>
        </header>

        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Search -->
            <div class="relative mb-8">
                <ng-icon
                    name="lucideSearch"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none"
                />
                <input
                    type="search"
                    placeholder="Search links by code, URL, or tag..."
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)"
                    class="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
            </div>

            @if (linksResource.hasValue()) {
                @let links = filteredLinks();
                @if (links.length > 0) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        @for (link of links; track link.id) {
                            <app-link-card
                                [link]="link"
                                (editRequested)="openEditModal($event)"
                                (deleteRequested)="openDeleteConfirm($event)"
                                (metadataScraped)="linksResource.reload()"
                            />
                        }
                    </div>
                } @else {
                    <!-- Empty State -->
                    <div data-testid="empty-state" class="flex flex-col items-center justify-center py-20 text-center">
                        <ng-icon name="lucideLink" class="text-4xl text-muted-foreground/40 mb-4" />
                        <h2 class="text-lg font-medium text-foreground mb-1">No links found</h2>
                        <p class="text-sm text-muted-foreground">
                            @if (linksResource.value() && linksResource.value().length === 0) {
                                Create your first shortened link to get started.
                            } @else {
                                No links match your search.
                            }
                        </p>
                    </div>
                }
            }
        </div>
    </div>

    <!-- Edit Modal (same component, edit mode via link input) -->
    <app-link-form-modal
        [link]="linkToEdit()"
        (linkSaved)="linksResource.reload()"
        (closed)="onEditModalClosed()"
    />

    <!-- Delete Confirmation Dialog -->
    <app-confirm-dialog
        title="Delete Link"
        [message]="deleteMessage()"
        confirmLabel="Delete"
        (confirmed)="onDeleteConfirmed()"
    />

    <!-- Toast Container -->
    <app-toast-container />
  `,
})
export class HomePage {
    private readonly linkService = inject(LinkService);
    private readonly toastService = inject(ToastService);
    readonly linksResource = this.linkService.linksResource;

    readonly searchQuery = signal('');

    // Edit state
    readonly linkToEdit = signal<Link | null>(null);

    // Delete state
    readonly linkToDelete = signal<Link | null>(null);
    readonly deleteConfirmDialog = viewChild.required(ConfirmDialog);
    readonly deleteMessage = computed(() => {
        const link = this.linkToDelete();
        return link
            ? `Are you sure you want to delete the link "${link.id}"? This action cannot be undone.`
            : '';
    });

    readonly filteredLinks = computed(() => {
        const links = this.linksResource.value();
        if (!links) return [];

        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return links;

        return links.filter((link) =>
            link.id.toLowerCase().includes(query) ||
            link.longUrl.toLowerCase().includes(query) ||
            (link.tags && link.tags.some(tag => tag.name.toLowerCase().includes(query)))
        );
    });

    openEditModal(link: Link): void {
        // Clear first so re-selecting the same link re-triggers the effect
        this.linkToEdit.set(null);
        setTimeout(() => this.linkToEdit.set(link));
    }

    onEditModalClosed(): void {
        this.linkToEdit.set(null);
    }

    openDeleteConfirm(link: Link): void {
        this.linkToDelete.set(link);
        this.deleteConfirmDialog().open();
    }

    onDeleteConfirmed(): void {
        const link = this.linkToDelete();
        if (!link) return;

        this.linkService.deleteLink(link.id).subscribe({
            next: () => {
                this.toastService.show('Link deleted.');
                this.linksResource.reload();
                this.linkToDelete.set(null);
                this.deleteConfirmDialog().close();
            },
            error: () => {
                this.toastService.show('Failed to delete link.');
                this.linkToDelete.set(null);
                this.deleteConfirmDialog().close();
            },
        });
    }
}
