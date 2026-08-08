import { Directive } from '@angular/core';
import { BrnDialogTitle } from '@spartan-ng/brain/dialog';
import { classes } from '../utils/hlm';

@Directive({
    selector: '[appDialogTitle]',
    hostDirectives: [BrnDialogTitle],
    host: { 'data-slot': 'dialog-title' },
})
export class DialogTitle {
    constructor() {
        classes(() => 'text-base leading-none font-medium');
    }
}
