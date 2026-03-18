import { cleanupClassTransition, runClassTransition } from './class.js';
import { cancelAllLayoutTransitions, move, resize } from './layout.js';
import type {
    ClassTransitionOptions,
    LayoutTransitionOptions,
} from './utils.js';

export { move, resize };
export type { ClassTransitionOptions, LayoutTransitionOptions };

export function transition(
    el: HTMLElement,
    name: string,
    options: ClassTransitionOptions = {}
) {
    cancel(el);
    return runClassTransition(el, name, options);
}

export function enter(el: HTMLElement, options: ClassTransitionOptions = {}) {
    return transition(el, 'enter', options);
}

export function leave(
    el: HTMLElement,
    options: ClassTransitionOptions = {}
) {
    return transition(el, 'leave', {
        ...options,
        detachFromLayout: options.detachFromLayout ?? true,
    });
}

export function cancel(el: HTMLElement) {
    cleanupClassTransition(el);
    cancelAllLayoutTransitions(el);
}
