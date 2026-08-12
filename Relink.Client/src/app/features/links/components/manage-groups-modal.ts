import { Component, computed, inject, output, signal, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { Button } from '../../../shared/components/ui/button/button';
import { Dialog } from '../../../shared/components/ui/dialog/dialog';
import { DialogContent } from '../../../shared/components/ui/dialog/dialog-content';
import { DialogDescription } from '../../../shared/components/ui/dialog/dialog-description';
import { DialogHeader } from '../../../shared/components/ui/dialog/dialog-header';
import { DialogPortal } from '../../../shared/components/ui/dialog/dialog-portal';
import { DialogTitle } from '../../../shared/components/ui/dialog/dialog-title';
import { Input } from '../../../shared/components/ui/input/input';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { ToastService } from '../../../shared/services/toast.service';
import { GroupService } from '../services/group-service';
import type { Group } from '../types/link';

@Component({
    selector: 'app-manage-groups-modal',
    imports: [
        NgIcon,
        Button,
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogPortal,
        DialogTitle,
        Input,
        ConfirmDialog,
    ],
    viewProviders: [provideIcons({ lucidePencil, lucideTrash2 })],
    template: `
        <app-dialog [state]="dialogState()" (closed)="onDialogClosed()">
            <button
                appBtn
                variant="secondary"
                type="button"
                data-testid="manage-groups-trigger"
                (click)="open()"
            >
                Manage Groups
            </button>

            <app-dialog-content *appDialogPortal="let ctx" class="sm:max-w-md">
                <app-dialog-header>
                    <h3 appDialogTitle>Manage Groups</h3>
                    <p appDialogDescription>
                        Rename or delete your Groups. Deleting a Group leaves its Links uncategorized.
                    </p>
                </app-dialog-header>

                <div class="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    @if (groups().length === 0) {
                        <p data-testid="manage-groups-empty" class="text-sm text-muted-foreground text-center py-6">
                            No Groups yet. Create one while adding a Link.
                        </p>
                    }
                    @for (group of groups(); track group.id) {
                        <div data-testid="group-row" class="flex items-center gap-2 rounded-lg border border-border p-2">
                            @if (editingId() === group.id) {
                                <input
                                    appInput
                                    data-testid="group-rename-input"
                                    type="text"
                                    [value]="editName()"
                                    [attr.aria-label]="'Rename ' + group.name"
                                    (input)="onEditNameInput($event)"
                                    (keydown.enter)="saveRename(group.id)"
                                />
                                <button
                                    appBtn
                                    size="sm"
                                    type="button"
                                    data-testid="group-rename-save"
                                    (click)="saveRename(group.id)"
                                >
                                    Save
                                </button>
                                <button appBtn variant="ghost" size="sm" type="button" (click)="cancelEdit()">
                                    Cancel
                                </button>
                            } @else {
                                <span data-testid="group-name" class="flex-1 text-sm font-medium">{{ group.name }}</span>
                                <button
                                    appBtn
                                    variant="ghost"
                                    size="icon-xs"
                                    type="button"
                                    data-testid="group-rename-button"
                                    [attr.aria-label]="'Rename ' + group.name"
                                    (click)="startEdit(group)"
                                >
                                    <ng-icon name="lucidePencil" class="text-muted-foreground" />
                                </button>
                                <button
                                    appBtn
                                    variant="ghost"
                                    size="icon-xs"
                                    type="button"
                                    data-testid="group-delete-button"
                                    [attr.aria-label]="'Delete ' + group.name"
                                    (click)="requestDelete(group)"
                                >
                                    <ng-icon name="lucideTrash2" class="text-muted-foreground" />
                                </button>
                            }
                        </div>
                    }
                </div>
            </app-dialog-content>
        </app-dialog>

        <app-confirm-dialog
            title="Delete Group"
            [message]="deleteMessage()"
            confirmLabel="Delete"
            (confirmed)="onDeleteConfirmed()"
        />
    `,
})
export class ManageGroupsModal {
    private readonly groupService = inject(GroupService);
    private readonly toastService = inject(ToastService);

    readonly groupsChanged = output<void>();

    readonly groupsResource = this.groupService.groupsResource;
    readonly groups = computed(() => this.groupsResource.value() ?? []);

    readonly dialogState = signal<'open' | 'closed'>('closed');
    readonly editingId = signal<number | null>(null);
    readonly editName = signal('');
    readonly groupToDelete = signal<Group | null>(null);
    readonly confirmDialog = viewChild.required(ConfirmDialog);

    readonly deleteMessage = computed(() => {
        const group = this.groupToDelete();
        return group
            ? `Delete the Group "${group.name}"? Its Links will become uncategorized.`
            : '';
    });

    open(): void {
        this.dialogState.set('open');
        this.groupsResource.reload();
    }

    onDialogClosed(): void {
        this.dialogState.set('closed');
        this.cancelEdit();
    }

    startEdit(group: Group): void {
        this.editingId.set(group.id);
        this.editName.set(group.name);
    }

    onEditNameInput(event: Event): void {
        this.editName.set((event.target as HTMLInputElement).value);
    }

    cancelEdit(): void {
        this.editingId.set(null);
        this.editName.set('');
    }

    saveRename(id: number): void {
        const name = this.editName().trim();
        if (!name) return;

        this.groupService.renameGroup(id, name).subscribe({
            next: () => {
                this.toastService.show('Group renamed.');
                this.groupsResource.reload();
                this.groupsChanged.emit();
                this.cancelEdit();
            },
            error: () => {
                this.toastService.show('Failed to rename group.');
            },
        });
    }

    requestDelete(group: Group): void {
        this.groupToDelete.set(group);
        this.confirmDialog().open();
    }

    onDeleteConfirmed(): void {
        const group = this.groupToDelete();
        if (!group) return;

        this.groupService.deleteGroup(group.id).subscribe({
            next: () => {
                this.toastService.show('Group deleted.');
                this.groupsResource.reload();
                this.groupsChanged.emit();
                this.groupToDelete.set(null);
                this.confirmDialog().close();
            },
            error: () => {
                this.toastService.show('Failed to delete group.');
                this.groupToDelete.set(null);
                this.confirmDialog().close();
            },
        });
    }
}
