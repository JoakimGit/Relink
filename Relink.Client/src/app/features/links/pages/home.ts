import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { LinkService } from "../services/link-service";
import { GroupService } from "../services/group-service";
import { LinkFormModal } from "../components/link-form-modal";
import { LinkCard } from "../components/link-card";
import { LinkAnalyticsModal } from "../components/link-analytics-modal";
import { ConfirmDialog } from "../../../shared/components/confirm-dialog";
import { ToastContainer } from "../../../shared/components/toast-container";
import { ToastService } from "../../../shared/services/toast.service";
import { SortDropdown, SortOrder } from "../components/sort-dropdown";
import { GroupPillBar, GroupPill } from "../components/group-pill-bar";
import { ManageGroupsModal } from "../components/manage-groups-modal";
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
        LinkAnalyticsModal,
        ConfirmDialog,
        ToastContainer,
        SortDropdown,
        GroupPillBar,
        ManageGroupsModal,
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
            <!-- Search + Sort -->
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <div class="relative flex-1">
                    <ng-icon
                        name="lucideSearch"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none"
                    />
                    <input
                        type="search"
                        placeholder="Search links by title, code, URL, or tag..."
                        [ngModel]="searchQuery()"
                        (ngModelChange)="searchQuery.set($event)"
                        class="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                </div>
                <app-sort-dropdown [sort]="sortOrder()" (sortChange)="sortOrder.set($event)" />
            </div>

            <!-- Group filter + Manage Groups -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <app-group-pill-bar
                    [pills]="groupPills()"
                    [selected]="selectedPill()"
                    (select)="selectedPill.set($event)"
                />
                <app-manage-groups-modal (groupsChanged)="onGroupsChanged()" />
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
                                (analyticsRequested)="openAnalyticsModal($event)"
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

    <!-- Analytics Modal -->
    <app-link-analytics-modal (visitCountReset)="onVisitCountReset()" />

    <!-- Toast Container -->
    <app-toast-container />
  `,
})
export class HomePage {
    private readonly linkService = inject(LinkService);
    private readonly groupService = inject(GroupService);
    private readonly toastService = inject(ToastService);
    readonly linksResource = this.linkService.linksResource;
    readonly groupsResource = this.groupService.groupsResource;

    readonly searchQuery = signal('');
    readonly sortOrder = signal<SortOrder>('newest');
    readonly selectedPill = signal('all');

    // Edit state
    readonly linkToEdit = signal<Link | null>(null);

    // Delete state
    readonly linkToDelete = signal<Link | null>(null);
    readonly deleteConfirmDialog = viewChild.required(ConfirmDialog);

    // Analytics state
    readonly analyticsModal = viewChild.required(LinkAnalyticsModal);

    readonly deleteMessage = computed(() => {
        const link = this.linkToDelete();
        return link
            ? `Are you sure you want to delete the link "${link.id}"? This action cannot be undone.`
            : '';
    });

    readonly groupPills = computed<GroupPill[]>(() => {
        const links = this.linksResource.value() ?? [];
        const groups = this.groupsResource.value() ?? [];

        const pills: GroupPill[] = [
            { key: 'all', label: 'All Links', count: links.length },
        ];

        for (const group of groups) {
            const count = links.filter((link) => link.group?.id === group.id).length;
            pills.push({ key: `group-${group.id}`, label: group.name, count });
        }

        const uncategorizedCount = links.filter((link) => !link.group).length;
        pills.push({ key: 'uncategorized', label: 'Uncategorized', count: uncategorizedCount });

        return pills;
    });

    readonly filteredLinks = computed(() => {
        const links = this.linksResource.value();
        if (!links) return [];

        let result = this.applyGroupFilter(links);

        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            result = result.filter((link) =>
                link.title.toLowerCase().includes(query) ||
                link.id.toLowerCase().includes(query) ||
                link.longUrl.toLowerCase().includes(query) ||
                (link.tags && link.tags.some(tag => tag.name.toLowerCase().includes(query)))
            );
        }

        return this.sortLinks(result);
    });

    private applyGroupFilter(links: Link[]): Link[] {
        const pill = this.selectedPill();
        if (pill === 'all') return links;
        if (pill === 'uncategorized') return links.filter((link) => !link.group);
        const groupId = Number(pill.replace('group-', ''));
        return links.filter((link) => link.group?.id === groupId);
    }

    private sortLinks(links: Link[]): Link[] {
        const sort = this.sortOrder();
        const sorted = [...links];
        switch (sort) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'mostVisited':
                return sorted.sort((a, b) => b.visitCount - a.visitCount);
            case 'titleAsc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sorted;
        }
    }

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

    openAnalyticsModal(link: Link): void {
        this.analyticsModal().open(link);
    }

    onVisitCountReset(): void {
        // Refresh the grid so each card's Visit Count reflects the reset.
        this.linksResource.reload();
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

    onGroupsChanged(): void {
        // A renamed or deleted Group can invalidate the current selection;
        // fall back to All Links so the grid never strands on a stale pill.
        this.selectedPill.set('all');
        this.linksResource.reload();
    }
}
