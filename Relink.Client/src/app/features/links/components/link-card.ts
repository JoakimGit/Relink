import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideLock,
    lucideCalendar,
    lucideKey,
    lucideEye,
    lucideGlobe,
} from '@ng-icons/lucide';
import { LinkCardActions } from './link-card-actions';
import { domainOf, faviconUrlFor } from '../../../shared/utils/url';
import type { Link } from '../types/link';

@Component({
    selector: 'app-link-card',
    imports: [NgIcon, DatePipe, LinkCardActions],
    viewProviders: [
        provideIcons({
            lucideLock,
            lucideCalendar,
            lucideKey,
            lucideEye,
            lucideGlobe,
        }),
    ],
    template: `
        <div
            data-testid="link-card"
            class="bg-card text-card-foreground flex flex-col shadow-sm border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
        >
            <!-- Title + favicon (primary line) and actions -->
            <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                    @if (faviconUrl()) {
                        <img
                            data-testid="favicon"
                            [src]="faviconUrl()"
                            alt=""
                            class="w-4 h-4 rounded-sm shrink-0"
                            (error)="onFaviconError($event)"
                        />
                    }
                    <h3
                        data-testid="link-card-title"
                        class="font-semibold text-sm text-foreground truncate"
                        [title]="link().title"
                    >
                        {{ link().title }}
                    </h3>
                    @if (link().metadata) {
                        <span
                            data-testid="globe-indicator"
                            role="img"
                            aria-label="Rich preview available"
                            class="flex items-center justify-center shrink-0 text-muted-foreground"
                            title="Rich preview available"
                        >
                            <ng-icon name="lucideGlobe" class="text-xs" />
                        </span>
                    }
                </div>
                <app-link-card-actions
                    [link]="link()"
                    (editRequested)="editRequested.emit($event)"
                    (deleteRequested)="deleteRequested.emit($event)"
                    (analyticsRequested)="analyticsRequested.emit($event)"
                />
            </div>

            <!-- Domain -->
            <p
                data-testid="link-card-domain"
                class="text-xs text-muted-foreground truncate mb-3"
                [title]="link().longUrl"
            >
                {{ domain() }}
            </p>

            <!-- Constraint Icons + Visit Count -->
            <div class="flex items-center gap-2 mb-3">
                @if (link().isLocked) {
                    <span data-testid="lock-icon" class="flex items-center gap-1 text-xs text-destructive" title="Locked">
                        <ng-icon name="lucideLock" class="text-xs" />
                    </span>
                }
                @if (link().passwordHash) {
                    <span data-testid="password-icon" class="flex items-center gap-1 text-xs text-amber-500" title="Password protected">
                        <ng-icon name="lucideKey" class="text-xs" />
                    </span>
                }
                @if (link().startDate || link().expirationDate) {
                    <span data-testid="calendar-icon" class="flex items-center gap-1 text-xs text-blue-500" title="Date restricted">
                        <ng-icon name="lucideCalendar" class="text-xs" />
                        @if (link().expirationDate) {
                            <span>{{ link().expirationDate | date:'dd.MM.yyyy' }}</span>
                        }
                        @if (link().startDate) {
                            <span>{{ link().startDate | date:'dd.MM.yyyy' }}</span>
                        }
                    </span>
                }
                <span data-testid="visit-count" class="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <ng-icon name="lucideEye" class="text-xs" />
                    {{ link().visitCount }}
                </span>
            </div>

            <!-- Tags -->
            @if (tags().length > 0) {
                <div class="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border">
                    @for (tag of tags(); track tag.id) {
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
    `,
})
export class LinkCard {
    readonly link = input.required<Link>();
    readonly editRequested = output<Link>();
    readonly deleteRequested = output<Link>();
    readonly analyticsRequested = output<Link>();

    readonly domain = computed(() => domainOf(this.link().longUrl));

    /** A favicon is only shown when Link Metadata has been scraped. */
    readonly faviconUrl = computed(() =>
        this.link().metadata ? faviconUrlFor(this.domain()) : null,
    );

    readonly tags = computed(() => this.link().tags ?? []);

    onFaviconError(event: Event) {
        (event.target as HTMLImageElement).style.display = 'none';
    }
}
