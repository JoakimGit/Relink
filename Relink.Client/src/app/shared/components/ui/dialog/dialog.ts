import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { BrnDialog, BrnDialogOverlay, provideBrnDialogDefaultOptions } from '@spartan-ng/brain/dialog';

@Component({
    selector: 'app-dialog',
    exportAs: 'appDialog',
    imports: [BrnDialogOverlay],
    providers: [
        {
            provide: BrnDialog,
            useExisting: forwardRef(() => Dialog),
        },
        provideBrnDialogDefaultOptions({}),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div brnDialogOverlay class="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 isolate bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs"></div>
        <ng-content />
    `,
})
export class Dialog extends BrnDialog { }
