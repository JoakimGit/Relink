import { Directive } from '@angular/core';
import { classes } from '../utils/hlm';

@Directive({
    selector: '[appDialogFooter],app-dialog-footer',
    host: { 'data-slot': 'dialog-footer' },
})
export class DialogFooter {
    constructor() {
        classes(() => 'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end');
    }
}
