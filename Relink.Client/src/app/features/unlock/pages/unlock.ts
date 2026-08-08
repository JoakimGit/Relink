import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LinkService } from '../../links/services/link-service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock, lucideKey } from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-unlock-page',
    imports: [NgIcon, FormsModule],
    viewProviders: [provideIcons({ lucideLock, lucideKey })],
    template: `
        <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="w-full max-w-sm mx-auto px-6">
                <!-- Header -->
                <div class="text-center mb-8">
                    <ng-icon name="lucideLock" class="text-4xl text-muted-foreground mb-4 inline-block" />
                    <h1 class="text-xl font-semibold tracking-tight" data-testid="protected-message">
                        This Link is password-protected
                    </h1>
                    <p class="text-sm text-muted-foreground mt-2">
                        Enter the password to continue.
                    </p>
                </div>

                <!-- Error message -->
                @if (errorMessage()) {
                    <div
                        data-testid="error-message"
                        class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        {{ errorMessage() }}
                    </div>
                }

                <!-- Password form -->
                <form (submit)="onSubmit($event)" class="space-y-4">
                    <div>
                        <input
                            type="text"
                            data-testid="password-input"
                            [ngModel]="password()"
                            (ngModelChange)="password.set($event)"
                            name="password"
                            placeholder="Password"
                            class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        data-testid="submit-button"
                        [disabled]="isSubmitting()"
                        class="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        @if (isSubmitting()) {
                            Unlocking...
                        } @else {
                            Unlock
                        }
                    </button>
                </form>
            </div>
        </div>
    `,
})
export class UnlockPage {
    private readonly route = inject(ActivatedRoute);
    private readonly linkService = inject(LinkService);

    readonly password = signal('');
    readonly errorMessage = signal('');
    readonly isSubmitting = signal(false);

    private get shortcode() {
        return this.route.snapshot.paramMap.get('shortcode') ?? '';
    }

    onSubmit(event?: Event) {
        event?.preventDefault();
        const pw = this.password().trim();
        if (!pw) return;

        this.errorMessage.set('');
        this.isSubmitting.set(true);

        this.linkService.unlockLink(this.shortcode, pw).subscribe({
            next: (response) => {
                window.location.href = response.longUrl;
            },
            error: (err) => {
                this.isSubmitting.set(false);
                if (err.status === 403) {
                    this.errorMessage.set('Incorrect password. Please try again.');
                } else {
                    this.errorMessage.set('Something went wrong. Please try again.');
                }
            },
        });
    }
}
