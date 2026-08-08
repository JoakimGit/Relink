import { Directive } from '@angular/core';
import { BrnDialogTrigger } from '@spartan-ng/brain/dialog';

@Directive({
    selector: 'button[appDialogTrigger],button[appDialogTriggerFor]',
    hostDirectives: [{ directive: BrnDialogTrigger, inputs: ['id', 'brnDialogTriggerFor: appDialogTriggerFor', 'type'] }],
    host: { 'data-slot': 'dialog-trigger' },
})
export class DialogTrigger { }
