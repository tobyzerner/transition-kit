# transition-kit

Tiny DOM transition primitives for explicit **enter**, **leave**, **move**, and **resize** transitions. Inspired by Vue's [`<transition>`](https://vuejs.org/guide/built-ins/transition.html) and [`<transition-group>`](https://vuejs.org/guide/built-ins/transition-group.html) components, but in plain DOM.

This library is for CSS-driven transition orchestration, not automatic animation. You decide when elements enter or leave, coordinate list reorders and container resizes around DOM mutations, and get a Promise back when transitions complete or are cancelled.

![Size](https://img.shields.io/bundlephobia/minzip/transition-kit)

[**Demo**](https://tobyzerner.github.io/transition-kit/index.html)

## Installation

```sh
npm install transition-kit --save
```

## Usage

### `enter`

Apply an **enter** transition to a newly-added element.

```ts
import { enter } from 'transition-kit';

parent.appendChild(el);
enter(el);
```

```css
@media (prefers-reduced-motion: no-preference) {
    .enter-active { transition: transform .5s }
    .enter-from { transform: translateY(100%) }
}
```

### `leave`

Apply a **leave** transition to an element.

```ts
import { leave } from 'transition-kit';

leave(el).then((completed) => {
    if (completed) el.remove();
});
```

```css
@media (prefers-reduced-motion: no-preference) {
    .leave-active { transition: opacity .5s }
    .leave-to { opacity: 0 }
}
```

While a `leave()` transition is active, transition-kit makes the leaving element `inert`.

If the leaving element might currently hold focus, move focus deliberately to the next appropriate target before or after removal. transition-kit prevents further interaction with the leaving element, but it does not choose a new focus destination for you.

For normally in-flow elements, `leave()` removes the leaving element from layout immediately while keeping it in the DOM for the duration of the leave animation. This lets surrounding elements move into their new positions straight away, which makes it easy to combine `leave()` with `move()`.

```ts
import { leave, move } from 'transition-kit';

const siblings = Array.from(list.children as HTMLCollectionOf<HTMLElement>)
    .filter((el) => el !== item);

move(siblings, () => {
    leave(item).then((completed) => {
        if (completed) item.remove();
    });
});
```

To disable this behavior, you can use the `detachFromLayout` option:

```ts
leave(el, { detachFromLayout: false })
```

`leave()` does not remove the element. Remove it only when the returned Promise resolves with `true`.

### `move`

Smoothly move elements into their new positions.

```ts
import { move } from 'transition-kit';

move(parent.children, () => {
    // Shuffle the children
    for (let i = parent.children.length; i >= 0; i--) {
        parent.appendChild(parent.children[Math.random() * i | 0]);
    }
}).then(() => {
    console.log('move settled');
});
```

```css
@media (prefers-reduced-motion: no-preference) {
    .move { transition: transform .5s }
}
```

`move()` accepts:

```ts
type LayoutTransitionOptions = {
    prefix?: string
};
```

### `resize`

Animate an element's size across a DOM mutation.

```ts
import { resize, leave, move } from 'transition-kit';

resize(list, () => {
    const siblings = Array.from(list.children as HTMLCollectionOf<HTMLElement>)
        .filter((el) => el !== item);

    move(siblings, () => {
        leave(item).then((completed) => {
            if (completed) item.remove();
        });
    });
}).then((completed) => {
    console.log('resize', completed);
});
```

```css
@media (prefers-reduced-motion: no-preference) {
    .resize { transition: width .5s, height .5s }
}
```

`resize()` accepts:

```ts
type LayoutTransitionOptions = {
    prefix?: string
};
```

### `transition`

Run a named transition on an element. Used under the hood by `enter` and `leave`.

1. The `${name}-active` and `${name}-from` classes are added
2. Next frame: the `${name}-from` class is removed, and the `${name}-to` class is added
3. When the transition ends: all classes are removed and the returned Promise resolves with `true`
4. If the transition is cancelled or superseded: the returned Promise resolves with `false`

```ts
import { transition } from 'transition-kit';

transition(
    el: HTMLElement,
    name: string,
    options?: ClassTransitionOptions
): Promise<boolean>;

type ClassTransitionOptions = {
    prefix?: string // optional prefix for animation class names
    detachFromLayout?: boolean // keep the element visually anchored while removing it from layout
};
```

### `cancel`

Cancel any currently-running transition, move animation, or resize animation on an element.

```ts
import { cancel } from 'transition-kit';

cancel(el: HTMLElement);
```

### Cancellation and Composition

- `transition()`, `enter()`, and `leave()` cancel any currently-running transition, move animation, or resize animation on that same element before starting a new class transition.
- `move()` returns a `Promise<void>` that resolves after every started move animation has either completed or been cancelled.
- `resize()` returns `Promise<boolean>`. It resolves `true` when the resize animation completes and `false` if it is cancelled or superseded.
- `move()` only replaces active move animations on the elements it animates.
- `resize()` only replaces the active resize animation on the element it animates.
- Cancelled or superseded class transitions resolve with `false`.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
