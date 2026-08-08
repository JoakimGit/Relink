import { Directive } from '@angular/core';
import { classes } from '../utils/hlm';

@Directive({
    selector: '[appDialogHeader],app-dialog-header',
    host: { 'data-slot': 'dialog-header' },
})
export class DialogHeader {
    constructor() {
        classes(() => 'gap-2 flex flex-col');
    }
}
