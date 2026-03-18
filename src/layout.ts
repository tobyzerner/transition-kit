import { isDetached } from './class.js';
import {
    getInlineStyles,
    getPrefix,
    nextFrame,
    setInlineStyles,
    waitForTransition,
    type InlineStyles,
    type LayoutTransitionOptions,
    type StyleKey,
} from './utils.js';

type ActiveLayoutTransition = {
    className: string;
    token: symbol;
    styles: InlineStyles;
    resolve: (completed: boolean) => void;
};

type PendingTransitionDuration = {
    value: string;
    count: number;
};

const activeMoves = new WeakMap<HTMLElement, ActiveLayoutTransition>();
const activeResizes = new WeakMap<HTMLElement, ActiveLayoutTransition>();
const pendingTransitionDurations = new WeakMap<
    HTMLElement,
    PendingTransitionDuration
>();

type LayoutTransitionStore = WeakMap<HTMLElement, ActiveLayoutTransition>;

type LayoutTransitionConfig = {
    store: LayoutTransitionStore;
    className: string;
    startStyles: InlineStyles;
    endStyles: InlineStyles;
};

export function move(
    elements: ArrayLike<HTMLElement>,
    mutate: () => void,
    options: LayoutTransitionOptions = {}
) {
    const items: { el: HTMLElement; before: DOMRect }[] = [];

    for (const el of Array.from(elements)) {
        if (getComputedStyle(el).display === 'none') {
            continue;
        }

        items.push({ el, before: el.getBoundingClientRect() });
    }

    mutate();

    const className = getPrefix(options) + 'move';
    const transitions: Promise<boolean>[] = [];

    for (const { el, before } of items) {
        if (isDetached(el)) {
            continue;
        }

        const after = el.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        const currentTransform = getComputedTransform(el);

        cancelLayoutTransition(el, activeMoves, false);

        if (!dx && !dy) {
            continue;
        }

        transitions.push(
            runLayoutTransition(el, {
                store: activeMoves,
                className,
                startStyles: {
                    transform: joinTransforms(
                        `translate(${dx}px, ${dy}px)`,
                        currentTransform
                    ),
                },
                endStyles: {
                    transform: el.style.transform,
                },
            })
        );
    }

    return Promise.all(transitions).then(() => undefined);
}

export function resize(
    el: HTMLElement,
    mutate: () => void,
    options: LayoutTransitionOptions = {}
) {
    const before = measureLayoutSize(el);
    cancelLayoutTransition(el, activeResizes, false);
    mutate();

    if (isDetached(el)) {
        return Promise.resolve(true);
    }

    const after = measureLayoutSize(el);
    if (before.width === after.width && before.height === after.height) {
        return Promise.resolve(true);
    }

    return runLayoutTransition(el, {
        store: activeResizes,
        className: getPrefix(options) + 'resize',
        startStyles: {
            boxSizing: 'border-box',
            width: `${before.width}px`,
            height: `${before.height}px`,
        },
        endStyles: {
            width: `${after.width}px`,
            height: `${after.height}px`,
        },
    });
}

export function cancelAllLayoutTransitions(el: HTMLElement) {
    cancelLayoutTransition(el, activeResizes, false);
    cancelLayoutTransition(el, activeMoves, false);
}

function runLayoutTransition(
    el: HTMLElement,
    config: LayoutTransitionConfig
): Promise<boolean> {
    const token = Symbol(config.className);
    const startStyles = {
        transitionDuration: '0s',
        ...config.startStyles,
    };
    const endStyles = {
        transitionDuration: '',
        ...config.endStyles,
    };
    const props = Object.keys({
        ...startStyles,
        ...endStyles,
    }) as StyleKey[];
    const originalTransitionDuration = retainPendingTransitionDuration(el);
    let resolve!: (completed: boolean) => void;
    const promise = new Promise<boolean>((nextResolve) => {
        resolve = nextResolve;
    });
    const transition: ActiveLayoutTransition = {
        className: config.className,
        token,
        styles: getInlineStyles(el, props),
        resolve,
    };

    if ('transitionDuration' in transition.styles) {
        transition.styles.transitionDuration = originalTransitionDuration;
    }

    config.store.set(el, transition);

    el.classList.add(config.className);
    setInlineStyles(el, startStyles);
    el.getBoundingClientRect();

    void nextFrame().then(async () => {
        releasePendingTransitionDuration(el);
        if (config.store.get(el)?.token !== token) return;

        await waitForTransition(el, () => {
            setInlineStyles(el, endStyles);
        });

        if (config.store.get(el)?.token !== token) return;

        finishLayoutTransition(el, config.store, transition, true);
    });

    return promise;
}

function retainPendingTransitionDuration(el: HTMLElement) {
    const pending = pendingTransitionDurations.get(el);
    if (pending) {
        pending.count += 1;
        return pending.value;
    }

    const value = el.style.transitionDuration;
    pendingTransitionDurations.set(el, {
        value,
        count: 1,
    });

    return value;
}

function releasePendingTransitionDuration(el: HTMLElement) {
    const pending = pendingTransitionDurations.get(el);
    if (!pending) return;

    pending.count -= 1;
    if (pending.count <= 0) {
        pendingTransitionDurations.delete(el);
    }
}

function cancelLayoutTransition(
    el: HTMLElement,
    store: LayoutTransitionStore,
    completed: boolean
) {
    const transition = store.get(el);
    if (!transition) return;

    finishLayoutTransition(el, store, transition, completed);
}

function finishLayoutTransition(
    el: HTMLElement,
    store: LayoutTransitionStore,
    transition: ActiveLayoutTransition,
    completed: boolean
) {
    restoreLayoutTransition(el, transition);
    store.delete(el);
    transition.resolve(completed);
}

function restoreLayoutTransition(
    el: HTMLElement,
    transition: ActiveLayoutTransition
) {
    el.classList.remove(transition.className);
    setInlineStyles(el, transition.styles);
}

type SizeLike = Pick<DOMRect, 'width' | 'height'>;

function measureLayoutSize(el: HTMLElement): SizeLike {
    return {
        width: el.offsetWidth,
        height: el.offsetHeight,
    };
}

function getComputedTransform(el: HTMLElement) {
    const transform = getComputedStyle(el).transform;
    return transform === 'none' ? '' : transform;
}

function joinTransforms(...transforms: (string | null | undefined)[]) {
    return transforms
        .filter(
            (transform): transform is string =>
                !!transform && transform !== 'none'
        )
        .join(' ');
}
