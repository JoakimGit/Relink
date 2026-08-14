import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideLock,
    lucideCalendarClock,
    lucideCalendarX,
    lucideGauge,
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
            lucideCalendarClock,
            lucideCalendarX,
            lucideGauge,
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
                @if (link().maxVisits !== null) {
                    <span
                        data-testid="max-visits-indicator"
                        class="flex items-center gap-1 text-xs"
                        [class.text-destructive]="maxVisitsReached()"
                        [class.text-muted-foreground]="!maxVisitsReached()"
                    >
                        <ng-icon name="lucideGauge" class="text-xs" />
                        <span>{{ link().visitCount }}/{{ link().maxVisits }}</span>
                    </span>
                }
                @if (link().startDate) {
                    <span
                        data-testid="start-date-indicator"
                        role="img"
                        class="flex items-center gap-1 text-xs text-blue-500"
                        [attr.aria-label]="'Starts ' + (link().startDate | date:'dd.MM.yyyy')"
                        [attr.title]="'Starts ' + (link().startDate | date:'dd.MM.yyyy')"
                    >
                        <ng-icon name="lucideCalendarClock" class="text-xs" />
                    </span>
                }
                @if (link().expirationDate) {
                    <span
                        data-testid="expiration-date-indicator"
                        role="img"
                        class="flex items-center gap-1 text-xs text-destructive"
                        [attr.aria-label]="'Expires ' + (link().expirationDate | date:'dd.MM.yyyy')"
                        [attr.title]="'Expires ' + (link().expirationDate | date:'dd.MM.yyyy')"
                    >
                        <ng-icon name="lucideCalendarX" class="text-xs" />
                    </span>
                }
                <span data-testid="visit-count" class="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <ng-icon name="lucideEye" class="text-xs" />
                    {{ link().visitCount }}
                </span>
            </div>

        </div>
    `,
})
export class LinkCard {
    readonly link = input.required<Link>();
    readonly editRequested = output<Link>();
    readonly deleteRequested = output<Link>();
    readonly analyticsRequested = output<Link>();

    readonly domain = computed(() => domainOf(this.link().longUrl));

    /** True once the Visit Count has reached the Link's Max Visits cap. */
    readonly maxVisitsReached = computed(() => {
        const max = this.link().maxVisits;
        return max !== null && this.link().visitCount >= max;
    });

    /** A favicon is only shown when Link Metadata has been scraped. */
    readonly faviconUrl = computed(() =>
        this.link().metadata ? faviconUrlFor(this.domain()) : null,
    );

    onFaviconError(event: Event) {
        (event.target as HTMLImageElement).style.display = 'none';
    }
}
