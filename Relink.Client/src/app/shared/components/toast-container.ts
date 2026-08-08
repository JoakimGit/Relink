import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-toast-container',
    template: `
        <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            @for (toast of toastService.toasts(); track $index) {
                <div
                    data-testid="toast"
                    class="pointer-events-auto rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg transition-all duration-300"
                    [class.opacity-0]="!toast.visible"
                    [class.translate-y-2]="!toast.visible"
                >
                    {{ toast.message }}
                </div>
            }
        </div>
    `,
})
export class ToastContainer {
    readonly toastService = inject(ToastService);
}
