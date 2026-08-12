import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ManageGroupsModal } from './manage-groups-modal';
import { GroupService } from '../services/group-service';
import { ToastService } from '../../../shared/services/toast.service';
import type { Group } from '../types/link';

const mockGroups: Group[] = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Personal' },
];

function createMockGroupService(groups: Group[] = mockGroups) {
    const data = signal(groups);
    return {
        groupsResource: {
            hasValue: () => true,
            value: () => data(),
            isLoading: () => false,
            error: () => null as Error | null,
            reload: vi.fn(),
        },
        createGroup: vi.fn().mockReturnValue(of({ id: 3, name: 'New' })),
        renameGroup: vi.fn().mockReturnValue(of({ id: 1, name: 'Renamed' })),
        deleteGroup: vi.fn().mockReturnValue(of(undefined)),
    };
}

function createMockToastService() {
    return {
        toasts: signal([]),
        show: vi.fn(),
    };
}

describe('ManageGroupsModal', () => {
    let fixture: ComponentFixture<ManageGroupsModal>;
    let nativeElement: HTMLElement;
    let mockGroupService: ReturnType<typeof createMockGroupService>;

    function setUp(groups: Group[] = mockGroups) {
        mockGroupService = createMockGroupService(groups);

        TestBed.configureTestingModule({
            imports: [ManageGroupsModal],
            providers: [
                { provide: GroupService, useValue: mockGroupService },
                { provide: ToastService, useValue: createMockToastService() },
            ],
        });

        fixture = TestBed.createComponent(ManageGroupsModal);
        nativeElement = fixture.nativeElement;
    }

    function openDialog() {
        const trigger = nativeElement.querySelector('[data-testid="manage-groups-trigger"]') as HTMLElement;
        trigger.click();
    }

    it('renders a Manage Groups trigger button', async () => {
        setUp();
        await fixture.whenStable();

        const trigger = nativeElement.querySelector('[data-testid="manage-groups-trigger"]');
        expect(trigger).toBeTruthy();
        expect(trigger!.textContent).toContain('Manage Groups');
    });

    it('lists all Groups when opened', async () => {
        setUp();
        await fixture.whenStable();
        openDialog();
        await fixture.whenStable();

        const names = Array.from(document.body.querySelectorAll('[data-testid="group-name"]')).map(
            (el) => el.textContent?.trim(),
        );
        expect(names).toEqual(['Work', 'Personal']);
    });

    it('shows an empty state when there are no Groups', async () => {
        setUp([]);
        await fixture.whenStable();
        openDialog();
        await fixture.whenStable();

        const empty = document.body.querySelector('[data-testid="manage-groups-empty"]');
        expect(empty).toBeTruthy();
        expect(empty!.textContent).toContain('No Groups');
    });

    it('renames a Group when the rename form is saved', async () => {
        setUp();
        await fixture.whenStable();
        openDialog();
        await fixture.whenStable();

        const renameButtons = document.body.querySelectorAll('[data-testid="group-rename-button"]');
        (renameButtons[0] as HTMLElement).click();
        await fixture.whenStable();

        const input = document.body.querySelector('[data-testid="group-rename-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.value).toBe('Work');

        input.value = 'Career';
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();

        const save = document.body.querySelector('[data-testid="group-rename-save"]') as HTMLElement;
        save.click();
        await fixture.whenStable();

        expect(mockGroupService.renameGroup).toHaveBeenCalledWith(1, 'Career');
    });

    it('asks for confirmation and deletes a Group when confirmed', async () => {
        setUp();
        await fixture.whenStable();
        openDialog();
        await fixture.whenStable();

        const deleteButtons = document.body.querySelectorAll('[data-testid="group-delete-button"]');
        (deleteButtons[1] as HTMLElement).click();
        await fixture.whenStable();

        const confirm = document.body.querySelector('[data-testid="confirm-dialog-confirm"]') as HTMLElement;
        expect(confirm).toBeTruthy();
        confirm.click();
        await fixture.whenStable();

        expect(mockGroupService.deleteGroup).toHaveBeenCalledWith(2);
    });
});
