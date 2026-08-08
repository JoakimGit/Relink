import type { BooleanInput } from '@angular/cdk/coercion';
import type { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Button } from '../button/button';
import { classes } from '../utils/hlm';
import { DialogClose } from './dialog-close';

type DialogContentContext = {
    $component?: ComponentType<unknown>;
    $dynamicComponentClass?: string;
    $showCloseButton?: boolean;
};

@Component({
    selector: 'app-dialog-content',
    imports: [NgComponentOutlet, Button, DialogClose, NgIcon],
    providers: [provideIcons({ lucideX })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'data-slot': 'dialog-content',
        '[attr.data-state]': 'state()',
    },
    template: `
		@if (component) {
			<ng-container [ngComponentOutlet]="component" />
		} @else {
			<ng-content />
		}

		@if (showCloseButton()) {
			<button appBtn variant="ghost" size="icon-sm" class="absolute end-2 top-2" appDialogClose>
				<span class="sr-only">close</span>
				<ng-icon name="lucideX" />
			</button>
		}
	`,
})
export class DialogContent {
    private readonly _dialogRef = inject(BrnDialogRef);
    private readonly _dialogContext = injectBrnDialogContext<DialogContentContext | null>({ optional: true });

    public readonly showCloseButton = input<boolean, BooleanInput>(this._dialogContext?.$showCloseButton ?? true, {
        transform: booleanAttribute,
    });

    public readonly state = computed(() => this._dialogRef?.state() ?? 'closed');

    public readonly component = this._dialogContext?.$component;
    private readonly _dynamicComponentClass = this._dialogContext?.$dynamicComponentClass;

    constructor() {
        classes(() => ['bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 relative mx-auto w-full outline-none sm:mx-0', this._dynamicComponentClass]);
    }
}
