import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SortDropdown, SortOrder } from './sort-dropdown';

describe('SortDropdown', () => {
    let fixture: ComponentFixture<SortDropdown>;
    let nativeElement: HTMLElement;

    function setUp(sort: SortOrder = 'newest') {
        TestBed.configureTestingModule({
            imports: [SortDropdown],
        });

        fixture = TestBed.createComponent(SortDropdown);
        fixture.componentRef.setInput('sort', sort);
        nativeElement = fixture.nativeElement;
    }

    it('renders the four sort options in order', async () => {
        setUp();
        await fixture.whenStable();

        const options = Array.from(
            nativeElement.querySelectorAll('option'),
        ).map((o) => ({ value: o.value, label: o.textContent?.trim() }));

        expect(options).toEqual([
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'mostVisited', label: 'Most visited' },
            { value: 'titleAsc', label: 'Alphabetical by Title' },
        ]);
    });

    it('defaults the selection to the provided sort order', async () => {
        setUp('newest');
        await fixture.whenStable();

        const select = nativeElement.querySelector('[data-testid="sort-dropdown"]') as HTMLSelectElement;
        expect(select.value).toBe('newest');
    });

    it('emits sortChange when the user selects a different order', async () => {
        setUp();
        await fixture.whenStable();

        const emitted = vi.fn();
        fixture.componentInstance.sortChange.subscribe(emitted);

        const select = nativeElement.querySelector('[data-testid="sort-dropdown"]') as HTMLSelectElement;
        select.value = 'oldest';
        select.dispatchEvent(new Event('change'));
        await fixture.whenStable();

        expect(emitted).toHaveBeenCalledWith('oldest');
    });
});
