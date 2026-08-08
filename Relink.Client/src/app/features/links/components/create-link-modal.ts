import { Component, computed, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "../../../shared/components/ui/button/button";
import { Dialog } from "../../../shared/components/ui/dialog/dialog";
import { DialogClose } from "../../../shared/components/ui/dialog/dialog-close";
import { DialogContent } from "../../../shared/components/ui/dialog/dialog-content";
import { DialogDescription } from "../../../shared/components/ui/dialog/dialog-description";
import { DialogFooter } from "../../../shared/components/ui/dialog/dialog-footer";
import { DialogHeader } from "../../../shared/components/ui/dialog/dialog-header";
import { DialogPortal } from "../../../shared/components/ui/dialog/dialog-portal";
import { DialogTitle } from "../../../shared/components/ui/dialog/dialog-title";
import { DialogTrigger } from "../../../shared/components/ui/dialog/dialog-trigger";
import { Input } from "../../../shared/components/ui/input/input";
import { Label } from "../../../shared/components/ui/label/label";
import { Textarea } from "../../../shared/components/ui/textarea/textarea";
import { Badge } from "../../../shared/components/ui/badge/badge";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
    lucidePlus,
    lucideX,
    lucideLoader,
    lucideChevronDown,
} from "@ng-icons/lucide";
import { LinkService } from "../services/link-service";
import type { CreateLinkRequest, Tag } from "../types/link";

@Component({
    selector: "app-create-link-modal",
    imports: [
        FormsModule,
        Button,
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogPortal,
        DialogTitle,
        DialogTrigger,
        Input,
        Label,
        Textarea,
        Badge,
        NgIcon,
    ],
    viewProviders: [
        provideIcons({
            lucidePlus,
            lucideX,
            lucideLoader,
            lucideChevronDown,
        }),
    ],
    template: `
        <app-dialog [state]="dialogState()" (closed)="resetForm()">
            <button
                appDialogTrigger
                appBtn
                class="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                (click)="openDialog()"
            >
                <ng-icon name="lucidePlus" class="text-sm" />
                Create Link
            </button>

            <app-dialog-content *appDialogPortal="let ctx" class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <app-dialog-header>
                    <h3 appDialogTitle>Create Link</h3>
                    <p appDialogDescription>
                        Fill in the details for your new shortened link. Only the Long URL is required.
                    </p>
                </app-dialog-header>

                <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
                    <!-- Long URL -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="longUrl">
                            Long URL <span class="text-destructive">*</span>
                        </label>
                        <input
                            appInput
                            id="longUrl"
                            name="longUrl"
                            type="url"
                            placeholder="https://example.com/very/long/url"
                            [ngModel]="longUrl()"
                            (ngModelChange)="longUrl.set($event)"
                            required
                        />
                        @if (longUrlError()) {
                            <p class="text-xs text-destructive">{{ longUrlError() }}</p>
                        }
                    </div>

                    <!-- Preferred Short Code -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="preferredShortCode">Preferred Short Code</label>
                        <input
                            appInput
                            id="preferredShortCode"
                            name="preferredShortCode"
                            type="text"
                            placeholder="my-custom-code"
                            [ngModel]="preferredShortCode()"
                            (ngModelChange)="preferredShortCode.set($event)"
                        />
                    </div>

                    <!-- Notes -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="notes">Notes</label>
                        <textarea
                            appTextarea
                            id="notes"
                            name="notes"
                            placeholder="Optional notes about this link..."
                            [ngModel]="notes()"
                            (ngModelChange)="notes.set($event)"
                        ></textarea>
                    </div>

                    <!-- Fallback URL -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="fallbackUrl">Fallback URL</label>
                        <input
                            appInput
                            id="fallbackUrl"
                            name="fallbackUrl"
                            type="url"
                            placeholder="https://backup.example.com"
                            [ngModel]="fallbackUrl()"
                            (ngModelChange)="fallbackUrl.set($event)"
                        />
                    </div>

                    <!-- Start Date & Expiration Date -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="startDate">Start Date</label>
                            <input
                                appInput
                                id="startDate"
                                name="startDate"
                                type="date"
                                [ngModel]="startDate()"
                                (ngModelChange)="startDate.set($event)"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="expirationDate">Expiration Date</label>
                            <input
                                appInput
                                id="expirationDate"
                                name="expirationDate"
                                type="date"
                                [ngModel]="expirationDate()"
                                (ngModelChange)="expirationDate.set($event)"
                            />
                        </div>
                    </div>

                    <!-- Password & Max Visits -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="password">Password</label>
                            <input
                                appInput
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Optional"
                                [ngModel]="password()"
                                (ngModelChange)="password.set($event)"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="maxVisits">Max Visits</label>
                            <input
                                appInput
                                id="maxVisits"
                                name="maxVisits"
                                type="number"
                                min="1"
                                placeholder="Unlimited"
                                [ngModel]="maxVisits()"
                                (ngModelChange)="maxVisits.set($event)"
                            />
                        </div>
                    </div>

                    <!-- Tags -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="tagInput">Tags</label>
                        <div class="relative">
                            <input
                                appInput
                                id="tagInput"
                                name="tagInput"
                                type="text"
                                placeholder="Type a tag name and press Enter..."
                                [ngModel]="tagInput()"
                                (ngModelChange)="onTagInputChange($event)"
                                (keydown)="onTagKeydown($event)"
                                (focus)="onTagFocus()"
                                (blur)="onTagBlur()"
                            />
                            <!-- Autocomplete dropdown -->
                            @if (showTagSuggestions() && filteredTagSuggestions().length > 0) {
                                <div
                                    data-testid="tag-suggestions"
                                    class="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-40 overflow-y-auto"
                                >
                                    @for (tag of filteredTagSuggestions(); track tag.id) {
                                        <button
                                            type="button"
                                            data-testid="tag-suggestion-item"
                                            class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                            (mousedown)="addTag(tag.name)"
                                        >
                                            {{ tag.name }}
                                        </button>
                                    }
                                </div>
                            }
                        </div>
                        <!-- Selected tag chips -->
                        @if (selectedTags().length > 0) {
                            <div class="flex flex-wrap gap-1.5 mt-1">
                                @for (tag of selectedTags(); track tag) {
                                    <span
                                        appBadge
                                        variant="secondary"
                                        data-testid="selected-tag-chip"
                                        class="inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        {{ tag }}
                                        <button
                                            type="button"
                                            data-testid="remove-tag"
                                            class="inline-flex items-center hover:text-destructive"
                                            (click)="removeTag(tag)"
                                            aria-label="Remove tag {{ tag }}"
                                        >
                                            <ng-icon name="lucideX" class="text-xs" />
                                        </button>
                                    </span>
                                }
                            </div>
                        }
                    </div>

                    <!-- Error message -->
                    @if (submitError()) {
                        <p data-testid="submit-error" class="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                            {{ submitError() }}
                        </p>
                    }

                    <app-dialog-footer>
                        <button appBtn variant="outline" type="button" appDialogClose [disabled]="isSubmitting()">
                            Cancel
                        </button>
                        <button
                            appBtn
                            type="submit"
                            [disabled]="isSubmitting() || !isFormValid()"
                            data-testid="submit-button"
                        >
                            @if (isSubmitting()) {
                                <ng-icon name="lucideLoader" class="animate-spin mr-1" />
                            }
                            Create Link
                        </button>
                    </app-dialog-footer>
                </form>
            </app-dialog-content>
        </app-dialog>
    `,
})
export class CreateLinkModal {
    private readonly linkService = inject(LinkService);

    /** Emits when a link is successfully created, so the parent can refresh. */
    readonly linkCreated = output<void>();

    // ─── Dialog state ───────────────────────────────────────────
    readonly dialogState = signal<"open" | "closed">("closed");

    // ─── Form fields ────────────────────────────────────────────
    readonly longUrl = signal("");
    readonly preferredShortCode = signal("");
    readonly notes = signal("");
    readonly fallbackUrl = signal("");
    readonly startDate = signal("");
    readonly expirationDate = signal("");
    readonly password = signal("");
    readonly maxVisits = signal("");
    readonly tagInput = signal("");
    readonly selectedTags = signal<string[]>([]);

    // ─── Tag autocomplete state ─────────────────────────────────
    readonly tagInputFocused = signal(false);

    // ─── Submission state ───────────────────────────────────────
    readonly isSubmitting = signal(false);
    readonly submitError = signal<string | null>(null);

    // ─── Validation ─────────────────────────────────────────────
    readonly longUrlError = computed(() => {
        const url = this.longUrl().trim();
        if (!url) return "Long URL is required.";
        try {
            new URL(url);
            return null;
        } catch {
            return "Please enter a valid URL.";
        }
    });

    readonly isFormValid = computed(() => {
        return this.longUrlError() === null && !this.isSubmitting();
    });

    // ─── Tag suggestions ────────────────────────────────────────
    readonly tagsResource = this.linkService.tagsResource;

    readonly existingTags = computed(() => this.tagsResource.value() ?? []);

    readonly filteredTagSuggestions = computed(() => {
        const input = this.tagInput().trim().toLowerCase();
        if (!input) return this.existingTags();

        return this.existingTags().filter(
            (tag) =>
                tag.name.toLowerCase().includes(input) &&
                !this.selectedTags().includes(tag.name),
        );
    });

    readonly showTagSuggestions = computed(() => {
        return (
            this.tagInputFocused() &&
            this.tagInput().trim().length > 0 &&
            this.filteredTagSuggestions().length > 0
        );
    });

    // ─── Dialog actions ─────────────────────────────────────────
    openDialog() {
        this.dialogState.set("open");
    }

    resetForm() {
        this.longUrl.set("");
        this.preferredShortCode.set("");
        this.notes.set("");
        this.fallbackUrl.set("");
        this.startDate.set("");
        this.expirationDate.set("");
        this.password.set("");
        this.maxVisits.set("");
        this.tagInput.set("");
        this.selectedTags.set([]);
        this.submitError.set(null);
        this.isSubmitting.set(false);
        this.dialogState.set("closed");
    }

    // ─── Tag actions ────────────────────────────────────────────
    addTag(name: string) {
        const trimmed = name.trim();
        if (trimmed && !this.selectedTags().includes(trimmed)) {
            this.selectedTags.update((tags) => [...tags, trimmed]);
        }
        this.tagInput.set("");
    }

    removeTag(name: string) {
        this.selectedTags.update((tags) => tags.filter((t) => t !== name));
    }

    onTagInputChange(value: string) {
        this.tagInput.set(value);
        this.submitError.set(null);
    }

    onTagKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            const input = this.tagInput().trim();
            if (input) {
                this.addTag(input);
            }
        } else if (
            event.key === "Backspace" &&
            this.tagInput() === "" &&
            this.selectedTags().length > 0
        ) {
            // Remove last tag on backspace when input is empty
            const tags = this.selectedTags();
            this.selectedTags.set(tags.slice(0, -1));
        }
    }

    onTagFocus() {
        this.tagInputFocused.set(true);
    }

    onTagBlur() {
        // Delay to allow mousedown on suggestion to fire first
        setTimeout(() => this.tagInputFocused.set(false), 150);
    }

    // ─── Submit ─────────────────────────────────────────────────
    async onSubmit(event: Event) {
        event.preventDefault();

        if (!this.isFormValid()) return;

        this.isSubmitting.set(true);
        this.submitError.set(null);

        const request: CreateLinkRequest = {
            longUrl: this.longUrl().trim(),
        };

        const preferredCode = this.preferredShortCode().trim();
        if (preferredCode) request.preferedShortCode = preferredCode;

        const notesValue = this.notes().trim();
        if (notesValue) request.notes = notesValue;

        const fallback = this.fallbackUrl().trim();
        if (fallback) request.fallbackUrl = fallback;

        const start = this.startDate();
        if (start) request.startDate = new Date(start).toISOString();

        const expiration = this.expirationDate();
        if (expiration) request.expirationDate = new Date(expiration).toISOString();

        const pw = this.password();
        if (pw) request.password = pw;

        const maxVisitsRaw = this.maxVisits().trim();
        if (maxVisitsRaw) {
            const parsed = parseInt(maxVisitsRaw, 10);
            if (!isNaN(parsed) && parsed > 0) {
                request.maxVisits = parsed;
            }
        }

        const tags = this.selectedTags();
        if (tags.length > 0) request.tags = tags;

        try {
            await this.linkService.createLink(request).toPromise();
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create link. Please try again.";
            this.submitError.set(message);
            this.isSubmitting.set(false);
            return;
        }

        this.linkCreated.emit();
        this.resetForm();
        this.linkService.linksResource.reload();
    }
}
