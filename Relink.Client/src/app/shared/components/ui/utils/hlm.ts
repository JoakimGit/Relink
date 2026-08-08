import { isPlatformBrowser } from '@angular/common';
import {
    DestroyRef,
    effect,
    ElementRef,
    HostAttributeToken,
    inject,
    Injector,
    PLATFORM_ID,
    runInInjectionContext,
} from '@angular/core';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function hlm(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Global map to track class managers per element
const elementClassManagers = new WeakMap<HTMLElement, ElementClassManager>();
// Global mutation observer for all elements
let globalObserver: MutationObserver | null = null;
const observedElements = new Set<HTMLElement>();

interface ElementClassManager {
    element: HTMLElement;
    sources: Map<number, { classes: Set<string>; order: number }>;
    baseClasses: Set<string>;
    isUpdating: boolean;
    nextOrder: number;
    hasInitialized: boolean;
    restoreRafId: number | null;
    transitionsSuppressed: boolean;
    previousTransition: string;
    previousTransitionPriority: string;
}

let sourceCounter = 0;

export type ClassesOptions = {
    injector?: Injector;
    elementRef?: ElementRef<HTMLElement>;
};

export function classes(computed: () => ClassValue[] | string, options: ClassesOptions = {}) {
    runInInjectionContext(options.injector ?? inject(Injector), () => {
        const elementRef = options.elementRef ?? inject(ElementRef);
        const platformId = inject(PLATFORM_ID);
        const destroyRef = inject(DestroyRef);
        const baseClasses = inject(new HostAttributeToken('class'), { optional: true });

        const element = elementRef.nativeElement;

        const sourceId = sourceCounter++;

        let manager = elementClassManagers.get(element);

        if (!manager) {
            const initialBaseClasses = new Set<string>();

            if (baseClasses) {
                toClassList(baseClasses).forEach((cls) => initialBaseClasses.add(cls));
            }

            manager = {
                element,
                sources: new Map(),
                baseClasses: initialBaseClasses,
                isUpdating: false,
                nextOrder: 0,
                hasInitialized: false,
                restoreRafId: null,
                transitionsSuppressed: false,
                previousTransition: '',
                previousTransitionPriority: '',
            };
            elementClassManagers.set(element, manager);

            setupGlobalObserver(platformId);
            observedElements.add(element);

            if (isPlatformBrowser(platformId)) {
                manager.previousTransition = element.style.getPropertyValue('transition');
                manager.previousTransitionPriority = element.style.getPropertyPriority('transition');
                element.style.setProperty('transition', 'none', 'important');
                manager.transitionsSuppressed = true;
            }
        }

        const sourceOrder = manager.nextOrder++;

        function updateClasses(): void {
            const newClasses = toClassList(computed());

            manager!.sources.set(sourceId, {
                classes: new Set(newClasses),
                order: sourceOrder,
            });

            updateElement(manager!);

            if (manager!.transitionsSuppressed) {
                manager!.transitionsSuppressed = false;
                manager!.restoreRafId = requestAnimationFrame(() => {
                    manager!.restoreRafId = null;
                    restoreTransitionSuppression(manager!);
                });
            }
        }

        destroyRef.onDestroy(() => {
            if (manager!.restoreRafId !== null) {
                cancelAnimationFrame(manager!.restoreRafId);
                manager!.restoreRafId = null;
            }

            if (manager!.transitionsSuppressed) {
                manager!.transitionsSuppressed = false;
                restoreTransitionSuppression(manager!);
            }

            manager!.sources.delete(sourceId);

            if (manager!.sources.size === 0) {
                cleanupManager(element);
            } else {
                updateElement(manager!);
            }
        });

        effect(updateClasses);
    });
}

function restoreTransitionSuppression(manager: ElementClassManager): void {
    const prev = manager.previousTransition;
    if (prev) {
        manager.element.style.setProperty('transition', prev, manager.previousTransitionPriority || undefined);
    } else {
        manager.element.style.removeProperty('transition');
    }
}

function setupGlobalObserver(platformId: object): void {
    if (isPlatformBrowser(platformId) && !globalObserver) {
        globalObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target as HTMLElement;
                    const manager = elementClassManagers.get(element);

                    if (manager && observedElements.has(element)) {
                        if (manager.isUpdating) continue;

                        const currentClasses = toClassList(element.className);
                        const allSourceClasses = new Set<string>();

                        for (const source of manager.sources.values()) {
                            for (const cls of source.classes) {
                                allSourceClasses.add(cls);
                            }
                        }

                        manager.baseClasses.clear();
                        for (const cls of currentClasses) {
                            if (!allSourceClasses.has(cls)) {
                                manager.baseClasses.add(cls);
                            }
                        }
                    }
                }
            }
        });

        globalObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });
    }
}

function updateElement(manager: ElementClassManager): void {
    if (manager.isUpdating) return;
    manager.isUpdating = true;

    const allClasses = new Set(manager.baseClasses);

    // Add source classes in order
    const sortedSources = [...manager.sources.values()].sort((a, b) => a.order - b.order);
    for (const source of sortedSources) {
        for (const cls of source.classes) {
            allClasses.add(cls);
        }
    }

    manager.element.className = [...allClasses].join(' ');

    manager.isUpdating = false;
}

function cleanupManager(element: HTMLElement): void {
    elementClassManagers.delete(element);
    observedElements.delete(element);
}

function toClassList(value: unknown): string[] {
    if (typeof value === 'string') {
        return value.split(/\s+/).filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.flatMap((item) => toClassList(item));
    }
    return [];
}
