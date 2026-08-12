import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GroupPillBar, GroupPill } from './group-pill-bar';

const pills: GroupPill[] = [
    { key: 'all', label: 'All Links', count: 5 },
    { key: 'group-1', label: 'Work', count: 3 },
    { key: 'uncategorized', label: 'Uncategorized', count: 2 },
];

describe('GroupPillBar', () => {
    let fixture: ComponentFixture<GroupPillBar>;
    let nativeElement: HTMLElement;

    function setUp(selected = 'all') {
        TestBed.configureTestingModule({
            imports: [GroupPillBar],
        });

        fixture = TestBed.createComponent(GroupPillBar);
        fixture.componentRef.setInput('pills', pills);
        fixture.componentRef.setInput('selected', selected);
        nativeElement = fixture.nativeElement;
    }

    it('renders one pill per entry with its label and count', async () => {
        setUp();
        await fixture.whenStable();

        const rendered = nativeElement.querySelectorAll('[data-testid="group-pill"]');
        expect(rendered.length).toBe(3);

        expect(rendered[0].textContent).toContain('All Links');
        expect(rendered[0].textContent).toContain('5');
        expect(rendered[1].textContent).toContain('Work');
        expect(rendered[1].textContent).toContain('3');
        expect(rendered[2].textContent).toContain('Uncategorized');
        expect(rendered[2].textContent).toContain('2');
    });

    it('marks the selected pill as pressed', async () => {
        setUp('group-1');
        await fixture.whenStable();

        const rendered = nativeElement.querySelectorAll('[data-testid="group-pill"]');
        expect(rendered[0].getAttribute('aria-pressed')).toBe('false');
        expect(rendered[1].getAttribute('aria-pressed')).toBe('true');
        expect(rendered[2].getAttribute('aria-pressed')).toBe('false');
    });

    it('emits the pill key when a pill is clicked', async () => {
        setUp();
        await fixture.whenStable();

        const emitted = vi.fn();
        fixture.componentInstance.select.subscribe(emitted);

        const rendered = nativeElement.querySelectorAll('[data-testid="group-pill"]');
        (rendered[2] as HTMLElement).click();
        await fixture.whenStable();

        expect(emitted).toHaveBeenCalledWith('uncategorized');
    });
});
