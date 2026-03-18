# Changelog

## Unreleased

### ⚠ BREAKING CHANGES

* The package is now published as `transition-kit`. Update installs and imports from `hello-goodbye` to `transition-kit`.
* `hello` and `goodbye` have been renamed to `enter` and `leave`.
* `transition`, `enter`, and `leave` now resolve `Promise<boolean>` instead of `Promise<void>`. They resolve `true` when a transition completes and `false` when it is cancelled or superseded.
* `leave` still does not remove elements automatically, but consumers should now only remove the element when the returned Promise resolves `true`.

### Features

* add `resize()` for animating container width and height across DOM mutations
* make `leave()` detach normally in-flow elements from layout by default so sibling `move()` transitions can run without CSS positioning hacks
* track enter/leave transitions, move transitions, and resize transitions independently so overlapping animations clean up reliably
* improve interrupted animation cleanup so inline transform, size, and transition-duration styles are restored correctly

### [0.2.2](https://github.com/tobyzerner/transition-kit/compare/v0.2.1...v0.2.2) (2024-01-10)


### Bug Fixes

* prevent transitions ending early due to transitioning child elements ([789dc79](https://github.com/tobyzerner/transition-kit/commit/789dc794046f8979ad8765fefe345d86ea5a0a8d))

### [0.2.1](https://github.com/tobyzerner/transition-kit/compare/v0.2.0...v0.2.1) (2023-06-25)


### Bug Fixes

* fix transitions not running reliably ([85c8c24](https://github.com/tobyzerner/transition-kit/commit/85c8c24719256e50337f42e5f8d0f64149fad33c))

## [0.2.0](https://github.com/tobyzerner/transition-kit/compare/v0.1.1...v0.2.0) (2023-03-21)


### ⚠ BREAKING CHANGES

* Removed `finish` callback from options. Use the Promise returned from `hello` and `goodbye` instead.

### Bug Fixes

* Fix transition end detection in cases where a transition has been defined, but no properties are actually transitioned ([eef3228](https://github.com/tobyzerner/transition-kit/commit/eef32285f7b06d0643a5e7a7bab12352724df5bd))

### [0.1.1](https://github.com/tobyzerner/transition-kit/compare/v0.1.0...v0.1.1) (2023-03-16)
### Bug Fixes
* Fix missing library bundle

## [0.1.0](https://github.com/tobyzerner/transition-kit/compare/v0.1.0-beta.5...v0.1.0) (2023-03-16) [YANKED]
### Breaking Changes
* Package is now ES module only

### Bug Fixes
* Improve transition reliability ([ff861b5](https://github.com/tobyzerner/transition-kit/commit/ff861b5b6fab7b5cd2dfb7d7d06f90c40c8d9d62))

## [0.1.0-beta.5](https://github.com/tobyzerner/transition-kit/compare/v0.1.0-beta.4...v0.1.0-beta.5) (2021-05-18)
### Fixed
* Clean up animation if transition gets cancelled.

## [0.1.0-beta.4](https://github.com/tobyzerner/transition-kit/compare/v0.1.0-beta.3...v0.1.0-beta.4) (2021-03-31)
### Added
* Expose `cancel` function.

### Fixed
* Don't `move` elements that were previously hidden.

## [0.1.0-beta.3](https://github.com/tobyzerner/transition-kit/compare/v0.1.0-beta.2...v0.1.0-beta.3) (2021-03-05)
### Fixed
* Fix transition classes not being removed properly in same cases.
* Recompile typings.
* Mark package as side-effect free.

## [0.1.0-beta.2](https://github.com/tobyzerner/transition-kit/compare/v0.1.0-beta.1...v0.1.0-beta.2) (2021-03-04)
### Changed
* Rename `animate` to `transition`.
* Rename `AnimationOptions.classPrefix` to `AnimationOptions.prefix`.

### Fixed
* Don't apply the `move` class to elements that aren't changing position.
* Fix buggy behavior when a new transition is started while a previous one is still running.
