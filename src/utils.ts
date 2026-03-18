export type ClassTransitionOptions = {
    prefix?: string;
    detachFromLayout?: boolean;
};

export type LayoutTransitionOptions = {
    prefix?: string;
};

export type StyleKey = Extract<keyof CSSStyleDeclaration, string>;

export type InlineStyles = Partial<Record<StyleKey, string>>;

export function getPrefix(
    options?: ClassTransitionOptions | LayoutTransitionOptions
) {
    return options?.prefix ? options.prefix + '-' : '';
}

export function nextFrame() {
    return new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
}

export function waitForTransition(el: HTMLElement, start: () => void) {
    return new Promise<void>((resolve) => {
        let started = false;
        const running = new Set<string>();

        const cleanup = () => {
            el.removeEventListener('transitionrun', onRun);
            el.removeEventListener('transitionend', onDone);
            el.removeEventListener('transitioncancel', onDone);
        };

        const finish = () => {
            cleanup();
            resolve();
        };

        const onRun = (event: TransitionEvent) => {
            if (event.target !== el) return;

            started = true;
            running.add(event.propertyName);
        };

        const onDone = (event: TransitionEvent) => {
            if (event.target !== el) return;

            running.delete(event.propertyName);
            if (!started || running.size) return;

            finish();
        };

        el.addEventListener('transitionrun', onRun);
        el.addEventListener('transitionend', onDone);
        el.addEventListener('transitioncancel', onDone);

        start();

        nextFrame().then(() => {
            if (!started) {
                finish();
            }
        });
    });
}

export function getInlineStyles(
    el: HTMLElement,
    props: readonly StyleKey[]
): InlineStyles {
    const style = el.style as unknown as Record<string, string>;
    const styles: InlineStyles = {};

    for (const prop of props) {
        styles[prop] = style[prop];
    }

    return styles;
}

export function setInlineStyles(el: HTMLElement, styles: InlineStyles) {
    const style = el.style as unknown as Record<string, string>;

    for (const prop of Object.keys(styles) as StyleKey[]) {
        style[prop] = styles[prop] ?? '';
    }
}
