import { Component, input, output, signal } from "@angular/core";
import { Button } from "./ui/button/button";
import { Dialog } from "./ui/dialog/dialog";
import { DialogClose } from "./ui/dialog/dialog-close";
import { DialogContent } from "./ui/dialog/dialog-content";
import { DialogDescription } from "./ui/dialog/dialog-description";
import { DialogFooter } from "./ui/dialog/dialog-footer";
import { DialogHeader } from "./ui/dialog/dialog-header";
import { DialogPortal } from "./ui/dialog/dialog-portal";
import { DialogTitle } from "./ui/dialog/dialog-title";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideTriangleAlert } from "@ng-icons/lucide";

@Component({
    selector: "app-confirm-dialog",
    imports: [
        Button,
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogPortal,
        DialogTitle,
        NgIcon,
    ],
    viewProviders: [provideIcons({ lucideTriangleAlert })],
    template: `
        <app-dialog [state]="dialogState()" (closed)="onCancel()">
            <app-dialog-content *appDialogPortal="let ctx" class="sm:max-w-md">
                <app-dialog-header>
                    <div class="flex items-center gap-3">
                        <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <ng-icon name="lucideTriangleAlert" class="text-destructive" />
                        </div>
                        <h3 appDialogTitle>{{ title() }}</h3>
                    </div>
                    <p appDialogDescription>
                        {{ message() }}
                    </p>
                </app-dialog-header>

                <app-dialog-footer>
                    <button appBtn variant="outline" type="button" appDialogClose [disabled]="isProcessing()">
                        Cancel
                    </button>
                    <button
                        appBtn
                        variant="destructive"
                        type="button"
                        data-testid="confirm-dialog-confirm"
                        [disabled]="isProcessing()"
                        (click)="onConfirm()"
                    >
                        {{ confirmLabel() }}
                    </button>
                </app-dialog-footer>
            </app-dialog-content>
        </app-dialog>
    `,
})
export class ConfirmDialog {
    readonly title = input("Are you sure?");
    readonly message = input("");
    readonly confirmLabel = input("Confirm");

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    readonly dialogState = signal<"open" | "closed">("closed");
    readonly isProcessing = signal(false);

    open(): void {
        this.isProcessing.set(false);
        this.dialogState.set("open");
    }

    close(): void {
        this.dialogState.set("closed");
    }

    onConfirm(): void {
        this.isProcessing.set(true);
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
        this.dialogState.set("closed");
    }
}
