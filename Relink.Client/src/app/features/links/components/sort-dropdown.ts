import { Component, input, output } from '@angular/core';

export type SortOrder = 'newest' | 'oldest' | 'mostVisited' | 'titleAsc';

@Component({
    selector: 'app-sort-dropdown',
    template: `
        <div class="flex items-center gap-2">
            <label for="sort-order" class="text-sm text-muted-foreground whitespace-nowrap">Sort</label>
            <select
                id="sort-order"
                name="sort"
                data-testid="sort-dropdown"
                class="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                [value]="sort()"
                (change)="onChange($event)"
            >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="mostVisited">Most visited</option>
                <option value="titleAsc">Alphabetical by Title</option>
            </select>
        </div>
    `,
})
export class SortDropdown {
    readonly sort = input.required<SortOrder>();
    readonly sortChange = output<SortOrder>();

    onChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value as SortOrder;
        this.sortChange.emit(value);
    }
}
