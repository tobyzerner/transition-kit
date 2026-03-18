import {
    type ClassTransitionOptions,
    getInlineStyles,
    getPrefix,
    nextFrame,
    setInlineStyles,
    waitForTransition,
    type InlineStyles,
    type StyleKey,
} from './utils.js';

type ActiveTransition = {
    prefix: string;
    token: symbol;
    isDetached: boolean;
    restoreStyles?: InlineStyles;
    restoreInert?: () => void;
};

const activeTransitions = new WeakMap<HTMLElement, ActiveTransition>();

const detachedMarginStyleProps = [
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginBlock',
    'marginBlockStart',
    'marginBlockEnd',
    'marginInline',
    'marginInlineStart',
    'marginInlineEnd',
] as const satisfies readonly StyleKey[];

const zeroDetachedMargins: InlineStyles = {};

for (const prop of detachedMarginStyleProps) {
    zeroDetachedMargins[prop] = '0px';
}

export async function runClassTransition(
    el: HTMLElement,
    name: string,
    options: ClassTransitionOptions = {}
) {
    const prefix = getPrefix(options) + name + '-';
    const token = Symbol(prefix);
    const shouldDetach = options.detachFromLayout ?? false;
    const detachedRect = shouldDetach
        ? measureUntransformedRect(el)
        : undefined;
    const restoreStyles = shouldDetach
        ? detachFromLayout(el, detachedRect)
        : undefined;
    const restoreInert = name === 'leave' ? makeElementInert(el) : undefined;

    const transition: ActiveTransition = {
        prefix,
        token,
        isDetached: restoreStyles !== undefined,
        restoreStyles,
        restoreInert,
    };

    activeTransitions.set(el, transition);
    el.classList.add(prefix + 'active', prefix + 'from');

    await nextFrame();

    if (activeTransitions.get(el)?.token !== token) return false;

    await waitForTransition(el, () => {
        el.classList.add(prefix + 'to');
        el.classList.remove(prefix + 'from');
    });

    if (activeTransitions.get(el)?.token !== token) return false;

    cleanupClassTransition(el, transition);

    return true;
}

export function cleanupClassTransition(
    el: HTMLElement,
    transition = activeTransitions.get(el)
) {
    if (!transition) return;

    el.classList.remove(
        transition.prefix + 'active',
        transition.prefix + 'from',
        transition.prefix + 'to'
    );

    if (transition.restoreStyles) {
        setInlineStyles(el, transition.restoreStyles);
    }

    transition.restoreInert?.();

    activeTransitions.delete(el);
}

export function isDetached(el: HTMLElement) {
    return activeTransitions.get(el)?.isDetached ?? false;
}

function detachFromLayout(
    el: HTMLElement,
    rect = measureUntransformedRect(el)
): InlineStyles | undefined {
    const computedPosition = getComputedStyle(el).position || 'static';
    if (computedPosition === 'absolute' || computedPosition === 'fixed') {
        return;
    }

    const offset = getPositionInContainingBlock(el, rect);
    if (!offset) {
        return;
    }

    const detachedStyles = {
        position: 'absolute',
        inset: 'auto',
        insetBlock: 'auto',
        insetBlockStart: 'auto',
        insetBlockEnd: 'auto',
        insetInline: 'auto',
        insetInlineStart: 'auto',
        insetInlineEnd: 'auto',
        top: `${offset.top}px`,
        left: `${offset.left}px`,
        right: 'auto',
        bottom: 'auto',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        boxSizing: 'border-box',
        ...zeroDetachedMargins,
    } satisfies InlineStyles;

    const restoreStyles = getInlineStyles(
        el,
        Object.keys(detachedStyles) as StyleKey[]
    );

    setInlineStyles(el, detachedStyles);

    return restoreStyles;
}

function getPositionInContainingBlock(
    el: HTMLElement,
    rect: RectLike = measureUntransformedRect(el)
) {
    const containingBlock = getAbsoluteContainingBlock(el);
    if (containingBlock) {
        if (getComputedStyle(containingBlock).display === 'inline') {
            return;
        }

        const containingRect = containingBlock.getBoundingClientRect();

        return {
            left:
                rect.left -
                containingRect.left -
                containingBlock.clientLeft +
                containingBlock.scrollLeft,
            top:
                rect.top -
                containingRect.top -
                containingBlock.clientTop +
                containingBlock.scrollTop,
        };
    }

    const view = el.ownerDocument.defaultView;

    return {
        left: rect.left + (view?.scrollX ?? 0),
        top: rect.top + (view?.scrollY ?? 0),
    };
}

function getAbsoluteContainingBlock(el: HTMLElement) {
    for (
        let ancestor = el.parentElement;
        ancestor;
        ancestor = ancestor.parentElement
    ) {
        if (establishesAbsoluteContainingBlock(ancestor)) {
            return ancestor;
        }
    }

    return undefined;
}

function establishesAbsoluteContainingBlock(el: HTMLElement) {
    const style = getComputedStyle(el);

    return (
        (style.position || 'static') !== 'static' ||
        createsContainingBlock(style.transform) ||
        createsContainingBlock(style.translate) ||
        createsContainingBlock(style.scale) ||
        createsContainingBlock(style.rotate) ||
        createsContainingBlock(style.perspective) ||
        createsContainingBlock(style.filter) ||
        /(^|\s)(layout|paint|strict|content)(\s|$)/i.test(style.contain) ||
        /(^|,)\s*(transform|translate|scale|rotate|perspective|filter|contain)\s*(,|$)/i.test(
            style.willChange
        )
    );
}

function createsContainingBlock(value: string) {
    const normalized = value.trim().toLowerCase();
    return !!normalized && normalized !== 'none' && normalized !== 'auto';
}

type RectLike = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

function measureUntransformedRect(el: HTMLElement): RectLike {
    const cssText = el.style.cssText;

    setInlineStyles(el, {
        transition: 'none',
        transform: 'none',
        translate: 'none',
        scale: 'none',
        rotate: 'none',
    });

    const rect = el.getBoundingClientRect();

    el.style.cssText = cssText;

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
    };
}

function makeElementInert(el: HTMLElement) {
    const wasInert = el.inert;
    el.inert = true;

    return () => {
        el.inert = wasInert;
    };
}
