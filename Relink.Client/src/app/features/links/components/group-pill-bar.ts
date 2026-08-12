import { Component, input, output } from '@angular/core';

export type GroupPill = {
    key: string;
    label: string;
    count: number;
};

@Component({
    selector: 'app-group-pill-bar',
    template: `
        <nav aria-label="Filter links by group" class="flex flex-wrap items-center gap-2">
            @for (pill of pills(); track pill.key) {
                <button
                    type="button"
                    data-testid="group-pill"
                    [attr.aria-pressed]="pill.key === selected()"
                    [class]="
                        pill.key === selected()
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium cursor-pointer'
                            : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-background text-foreground px-3 py-1.5 text-sm font-medium hover:bg-muted cursor-pointer'
                    "
                    (click)="select.emit(pill.key)"
                >
                    {{ pill.label }}
                    <span
                        data-testid="group-pill-count"
                        class="inline-flex items-center justify-center min-w-5 h-5 rounded-full px-1 text-xs"
                        [class]="
                            pill.key === selected()
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        "
                    >
                        {{ pill.count }}
                    </span>
                </button>
            }
        </nav>
    `,
})
export class GroupPillBar {
    readonly pills = input.required<GroupPill[]>();
    readonly selected = input.required<string>();
    readonly select = output<string>();
}
