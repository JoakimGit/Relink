import { Injectable, signal } from '@angular/core';

export type Toast = {
    id: number;
    message: string;
    visible: boolean;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
    private nextId = 1;
    readonly toasts = signal<Toast[]>([]);

    show(message: string, durationMs = 2000): void {
        const id = this.nextId++;
        const toast: Toast = { id, message, visible: true };
        this.toasts.update((t) => [...t, toast]);

        setTimeout(() => {
            this.toasts.update((t) =>
                t.map((toast) =>
                    toast.id === id ? { ...toast, visible: false } : toast,
                ),
            );
            // Remove after fade-out animation
            setTimeout(() => {
                this.toasts.update((t) => t.filter((toast) => toast.id !== id));
            }, 300);
        }, durationMs);
    }
}
