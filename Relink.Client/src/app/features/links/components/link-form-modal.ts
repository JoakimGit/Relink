import { Component, computed, inject, input, output, signal, effect } from "@angular/core";
import { DatePipe } from "@angular/common";
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
    lucideGlobe,
} from "@ng-icons/lucide";
import { LinkService } from "../services/link-service";
import type { CreateLinkRequest, UpdateLinkRequest, Link } from "../types/link";

@Component({
    selector: "app-link-form-modal",
    imports: [
        FormsModule,
        DatePipe,
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
            lucideGlobe,
        }),
    ],
    template: `
        <app-dialog [state]="dialogState()" (closed)="resetForm()">
            @if (!isEditMode()) {
                <!-- Create trigger button -->
                <button
                    appDialogTrigger
                    appBtn
                    class="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                    (click)="openDialog()"
                >
                    <ng-icon name="lucidePlus" class="text-sm" />
                    Create Link
                </button>
            }

            <app-dialog-content *appDialogPortal="let ctx" class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <app-dialog-header>
                    <h3 appDialogTitle>{{ isEditMode() ? 'Edit Link' : 'Create Link' }}</h3>
                    <p appDialogDescription>
                        @if (isEditMode()) {
                            Update the details for <span class="font-mono text-foreground">{{ editLinkId() }}</span>.
                        } @else {
                            Fill in the details for your new shortened link. Title and Long URL are required.
                        }
                    </p>
                </app-dialog-header>

                <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
                    <!-- Title -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="linkForm-title">
                            Title <span class="text-destructive">*</span>
                        </label>
                        <input
                            appInput
                            id="linkForm-title"
                            name="title"
                            type="text"
                            placeholder="A short, human-readable name"
                            maxlength="60"
                            [ngModel]="title()"
                            (ngModelChange)="title.set($event); titleTouched.set(true)"
                            required
                        />
                        @if (titleTouched() && titleError()) {
                            <p class="text-xs text-destructive">{{ titleError() }}</p>
                        }
                    </div>

                    <!-- Long URL -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="linkForm-longUrl">
                            Long URL <span class="text-destructive">*</span>
                        </label>
                        <input
                            appInput
                            id="linkForm-longUrl"
                            name="longUrl"
                            type="url"
                            placeholder="https://example.com/very/long/url"
                            [ngModel]="longUrl()"
                            (ngModelChange)="longUrl.set($event); longUrlTouched.set(true)"
                            required
                        />
                        @if (longUrlTouched() && longUrlError()) {
                            <p class="text-xs text-destructive">{{ longUrlError() }}</p>
                        }
                    </div>

                    <!-- Preferred Short Code -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="linkForm-preferredShortCode">Preferred Short Code</label>
                        <input
                            appInput
                            id="linkForm-preferredShortCode"
                            name="preferredShortCode"
                            type="text"
                            placeholder="my-custom-code"
                            [ngModel]="preferredShortCode()"
                            (ngModelChange)="preferredShortCode.set($event)"
                        />
                    </div>

                    <!-- Notes -->
                    <div class="flex flex-col gap-1.5">
                        <label appLabel for="linkForm-notes">Notes</label>
                        <textarea
                            appTextarea
                            id="linkForm-notes"
                            name="notes"
                            placeholder="Optional notes about this link..."
                            [ngModel]="notes()"
                            (ngModelChange)="notes.set($event)"
                        ></textarea>
                    </div>

                    <!-- Start Date & Expiration Date -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="linkForm-startDate">Start Date</label>
                            <input
                                appInput
                                id="linkForm-startDate"
                                name="startDate"
                                type="date"
                                [ngModel]="startDate()"
                                (ngModelChange)="startDate.set($event)"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="linkForm-expirationDate">Expiration Date</label>
                            <input
                                appInput
                                id="linkForm-expirationDate"
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
                            <label appLabel for="linkForm-password">Password</label>
                            <input
                                appInput
                                id="linkForm-password"
                                name="password"
                                type="password"
                                [placeholder]="isEditMode() ? 'Leave empty to keep current' : 'Optional'"
                                [ngModel]="password()"
                                (ngModelChange)="password.set($event)"
                            />
                            @if (isEditMode()) {
                                <p class="text-xs text-muted-foreground">Leave empty to keep current Password Lock.</p>
                            }
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label appLabel for="linkForm-maxVisits">Max Visits</label>
                            <input
                                appInput
                                id="linkForm-maxVisits"
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
                        <label appLabel for="linkForm-tagInput">Tags</label>
                        <div class="relative">
                            <input
                                appInput
                                id="linkForm-tagInput"
                                name="tagInput"
                                type="text"
                                placeholder="Type a tag name and press Enter..."
                                [ngModel]="tagInput()"
                                (ngModelChange)="onTagInputChange($event)"
                                (keydown)="onTagKeydown($event)"
                                (focus)="onTagFocus()"
                                (blur)="onTagBlur()"
                            />
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
                                            [attr.aria-label]="'Remove tag ' + tag"
                                        >
                                            <ng-icon name="lucideX" class="text-xs" />
                                        </button>
                                    </span>
                                }
                            </div>
                        }
                    </div>

                    <!-- Metadata (read-only, edit mode only) -->
                    @if (isEditMode() && link()?.metadata?.title) {
                        <div data-testid="metadata-section" class="rounded-lg border border-border bg-muted/30 p-4">
                            <div class="flex items-center gap-2 mb-3">
                                <ng-icon name="lucideGlobe" class="text-muted-foreground text-sm" />
                                <h4 class="text-sm font-medium text-foreground">Metadata</h4>
                                @if (link()?.metadata?.lastScrapedAt) {
                                    <span class="text-xs text-muted-foreground">
                                        · scraped {{ link()?.metadata?.lastScrapedAt | date:'medium' }}
                                    </span>
                                }
                            </div>
                            <div class="flex gap-3">
                                @if (link()?.metadata?.imageUrl) {
                                    <img
                                        [src]="link()?.metadata?.imageUrl"
                                        [alt]="link()?.metadata?.title"
                                        class="w-16 h-16 rounded-md object-cover shrink-0 bg-muted"
                                        (error)="onMetadataImageError($event)"
                                    />
                                }
                                <div class="min-w-0 space-y-1">
                                    <p class="text-sm font-medium text-foreground">{{ link()?.metadata?.title }}</p>
                                    @if (link()?.metadata?.description) {
                                        <p class="text-xs text-muted-foreground line-clamp-2">{{ link()?.metadata?.description }}</p>
                                    }
                                    @if (link()?.metadata?.siteName) {
                                        <p class="text-xs text-muted-foreground">{{ link()?.metadata?.siteName }}</p>
                                    }
                                </div>
                            </div>
                        </div>
                    }

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
                            {{ isEditMode() ? 'Save Changes' : 'Create Link' }}
                        </button>
                    </app-dialog-footer>
                </form>
            </app-dialog-content>
        </app-dialog>
    `,
})
export class LinkFormModal {
    private readonly linkService = inject(LinkService);

    // ─── Mode ───────────────────────────────────────────────────
    /** When set, the modal operates in edit mode. When null, it's create mode. */
    readonly link = input<Link | null>(null);

    readonly isEditMode = computed(() => this.link() !== null);
    readonly editLinkId = computed(() => this.link()?.id ?? '');

    // ─── Outputs ────────────────────────────────────────────────
    /** Emits when a link is successfully created or updated. */
    readonly linkSaved = output<void>();

    /** Emits when the dialog is closed (cancel, click-outside, or after save). */
    readonly closed = output<void>();

    // ─── Dialog state ───────────────────────────────────────────
    readonly dialogState = signal<"open" | "closed">("closed");

    // ─── Form fields ────────────────────────────────────────────
    readonly title = signal("");
    readonly longUrl = signal("");
    readonly preferredShortCode = signal("");
    readonly notes = signal("");
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
    readonly titleTouched = signal(false);
    readonly longUrlTouched = signal(false);

    // ─── Validation ─────────────────────────────────────────────
    readonly titleError = computed(() => {
        const title = this.title().trim();
        if (!title) return "Title is required.";
        if (title.length > 60) return "Title must be 60 characters or fewer.";
        return null;
    });

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
        return (
            this.titleError() === null &&
            this.longUrlError() === null &&
            !this.isSubmitting()
        );
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

    constructor() {
        // Watch for link input changes to pre-fill the form in edit mode
        effect(() => {
            const linkData = this.link();
            if (linkData) {
                this.preFillForm(linkData);
                this.dialogState.set("open");
            }
        });
    }

    private preFillForm(linkData: Link): void {
        this.title.set(linkData.title);
        this.longUrl.set(linkData.longUrl);
        this.preferredShortCode.set(linkData.id);
        this.notes.set(linkData.notes ?? "");
        this.startDate.set(linkData.startDate ? linkData.startDate.split("T")[0] : "");
        this.expirationDate.set(linkData.expirationDate ? linkData.expirationDate.split("T")[0] : "");
        this.password.set("");
        this.maxVisits.set(linkData.maxVisits?.toString() ?? "");
        this.selectedTags.set(linkData.tags?.map((t) => t.name) ?? []);
        this.submitError.set(null);
        this.isSubmitting.set(false);
        this.titleTouched.set(false);
        this.longUrlTouched.set(false);
    }

    // ─── Dialog actions ─────────────────────────────────────────
    openDialog() {
        this.dialogState.set("open");
    }

    resetForm() {
        this.title.set("");
        this.longUrl.set("");
        this.preferredShortCode.set("");
        this.notes.set("");
        this.startDate.set("");
        this.expirationDate.set("");
        this.password.set("");
        this.maxVisits.set("");
        this.tagInput.set("");
        this.selectedTags.set([]);
        this.submitError.set(null);
        this.isSubmitting.set(false);
        this.titleTouched.set(false);
        this.longUrlTouched.set(false);
        this.dialogState.set("closed");
        this.closed.emit();
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
            const tags = this.selectedTags();
            this.selectedTags.set(tags.slice(0, -1));
        }
    }

    onTagFocus() {
        this.tagInputFocused.set(true);
    }

    onTagBlur() {
        setTimeout(() => this.tagInputFocused.set(false), 150);
    }

    onMetadataImageError(event: Event) {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    // ─── Submit ─────────────────────────────────────────────────
    async onSubmit(event: Event) {
        event.preventDefault();

        if (!this.isFormValid()) return;

        if (this.isEditMode()) {
            await this.submitEdit();
        } else {
            await this.submitCreate();
        }
    }

    /** Builds the common fields from the form into a partial request. */
    private applyFormFields<T extends Record<string, unknown>>(
        request: T,
        nullOutEmpty: boolean,
    ): T {
        const s = (v: string) => v.trim();
        const date = (v: string) => (v ? new Date(v).toISOString() : null);
        const num = (v: unknown) => {
            const n = parseInt(String(v).trim(), 10);
            return !isNaN(n) && n > 0 ? n : null;
        };

        const titleVal = s(this.title());
        (request as Record<string, unknown>)['title'] = titleVal;

        const preferredCode = s(this.preferredShortCode());
        if (preferredCode) (request as Record<string, unknown>)['preferedShortCode'] = preferredCode;

        const notesVal = s(this.notes());
        if (notesVal) (request as Record<string, unknown>)['notes'] = notesVal;
        else if (nullOutEmpty) (request as Record<string, unknown>)['notes'] = null;

        const start = date(this.startDate());
        if (start) (request as Record<string, unknown>)['startDate'] = start;
        else if (nullOutEmpty) (request as Record<string, unknown>)['startDate'] = null;

        const expiration = date(this.expirationDate());
        if (expiration) (request as Record<string, unknown>)['expirationDate'] = expiration;
        else if (nullOutEmpty) (request as Record<string, unknown>)['expirationDate'] = null;

        const pw = s(this.password());
        if (pw) (request as Record<string, unknown>)['password'] = pw;

        const max = num(this.maxVisits());
        if (max) (request as Record<string, unknown>)['maxVisits'] = max;
        else if (nullOutEmpty) (request as Record<string, unknown>)['maxVisits'] = null;

        const tags = this.selectedTags();
        if (tags.length > 0) (request as Record<string, unknown>)['tags'] = tags;

        return request;
    }

    private async submitCreate() {
        this.isSubmitting.set(true);
        this.submitError.set(null);

        const request = this.applyFormFields<CreateLinkRequest>(
            { longUrl: this.longUrl().trim(), title: this.title().trim() },
            false,
        );

        try {
            await this.linkService.createLink(request).toPromise();
        } catch (err: unknown) {
            this.submitError.set(
                err instanceof Error ? err.message : 'Failed to create link. Please try again.',
            );
            this.isSubmitting.set(false);
            return;
        }

        this.linkSaved.emit();
        this.resetForm();
        this.linkService.linksResource.reload();
    }

    private async submitEdit() {
        const linkData = this.link();
        if (!linkData) return;

        this.isSubmitting.set(true);
        this.submitError.set(null);

        const request = this.applyFormFields<UpdateLinkRequest>(
            { longUrl: this.longUrl().trim(), title: this.title().trim() },
            true,
        );

        try {
            await this.linkService.updateLink(linkData.id, request).toPromise();
        } catch (err: unknown) {
            this.submitError.set(
                err instanceof Error ? err.message : 'Failed to update link. Please try again.',
            );
            this.isSubmitting.set(false);
            return;
        }

        this.linkSaved.emit();
        this.resetForm();
        this.linkService.linksResource.reload();
    }
}
