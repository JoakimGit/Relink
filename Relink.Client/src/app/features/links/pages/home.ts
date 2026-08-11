import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { DatePipe } from "@angular/common";
import { LinkService } from "../services/link-service";
import { LinkFormModal } from "../components/link-form-modal";
import { LinkCardActions } from "../components/link-card-actions";
import { ConfirmDialog } from "../../../shared/components/confirm-dialog";
import { ToastContainer } from "../../../shared/components/toast-container";
import { ToastService } from "../../../shared/services/toast.service";
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideLock,
    lucideCalendar,
    lucideKey,
    lucideSearch,
    lucidePlus,
    lucideLink,
    lucideEye,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import type { Link } from "../types/link";

@Component({
    selector: "app-home-page",
    imports: [
        NgIcon,
        FormsModule,
        DatePipe,
        LinkFormModal,
        LinkCardActions,
        ConfirmDialog,
        ToastContainer,
    ],
    viewProviders: [provideIcons({
        lucideLock,
        lucideCalendar,
        lucideKey,
        lucideSearch,
        lucidePlus,
        lucideLink,
        lucideEye,
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
                            <div
                                data-testid="link-card"
                                class="bg-card text-card-foreground flex flex-col shadow-sm border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
                            >
                                <!-- Short Code, Visit Count & Actions -->
                                <div class="flex items-center justify-between mb-2">
                                    <h3 class="font-mono font-semibold text-sm text-primary tracking-wide">
                                        {{ link.id }}
                                    </h3>
                                    <div class="flex items-center gap-1">
                                        <span class="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                                            <ng-icon name="lucideEye" class="text-xs" />
                                            {{ link.visitCount }}
                                        </span>
                                        <app-link-card-actions
                                            [link]="link"
                                            (editRequested)="openEditModal($event)"
                                            (deleteRequested)="openDeleteConfirm($event)"
                                            (metadataScraped)="linksResource.reload()"
                                        />
                                    </div>
                                </div>

                                <!-- Long URL -->
                                <p class="text-xs text-muted-foreground truncate mb-3" [title]="link.longUrl">
                                    {{ link.longUrl }}
                                </p>

                                <!-- Constraint Icons -->
                                <div class="flex items-center gap-2 mb-3">
                                    @if (link.isLocked) {
                                        <span data-testid="lock-icon" class="flex items-center gap-1 text-xs text-destructive" title="Locked">
                                            <ng-icon name="lucideLock" class="text-xs" />
                                        </span>
                                    }
                                    @if (link.passwordHash) {
                                        <span data-testid="password-icon" class="flex items-center gap-1 text-xs text-amber-500" title="Password protected">
                                            <ng-icon name="lucideKey" class="text-xs" />
                                        </span>
                                    }
                                    @if (link.startDate || link.expirationDate) {
                                        <span data-testid="calendar-icon" class="flex items-center gap-1 text-xs text-blue-500" title="Date restricted">
                                            <ng-icon name="lucideCalendar" class="text-xs" />
                                            @if (link.expirationDate) {
                                                <span>{{ link.expirationDate | date:'dd.MM.yyyy' }}</span>
                                            }
                                            @if (link.startDate) {
                                                <span>{{ link.startDate | date:'dd.MM.yyyy' }}</span>
                                            }
                                        </span>
                                    }
                                </div>

                                <!-- Tags -->
                                @if (link.tags && link.tags.length > 0) {
                                    <div class="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border">
                                        @for (tag of link.tags; track tag.id) {
                                            <span
                                                data-testid="tag-chip"
                                                class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                                            >
                                                {{ tag.name }}
                                            </span>
                                        }
                                    </div>
                                }
                            </div>
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
