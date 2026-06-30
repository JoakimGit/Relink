---
name: angular-best-practices
description: Use whenever modifying files under apps/web/, client/, or the Angular frontend.
  Do not use for Aspire, backend APIs, infrastructure, or tests unrelated to Angular.
---

# Angular Best Practices

Use this skill whenever you are working inside the Angular client application.

## Goals

Produce code that is:

- idiomatic Angular v22+
- strongly typed
- signal-first
- accessible
- maintainable
- performant

## TypeScript

- Use strict typing.
- Prefer inference when obvious.
- Never use `any`; use `unknown` if necessary.
- Prefer immutable patterns.

## Angular

- Use standalone components.
- Do not specify `standalone: true`.
- Do not specify `changeDetection`.
- Prefer signals over RxJS for component state.
- Use `computed()` for derived values.
- Use `input()` / `output()`.
- Use `inject()` instead of constructor injection.
- Lazy-load feature routes.
- Prefer linkedSignal() when writable derived state is appropriate.
- Prefer resource() for async component data where it replaces manual loading/error signals.
- Prefer httpResource() for straightforward HTTP-backed reactive data.
- Prefer effect() only for side effects; never for state propagation.
- Avoid unnecessary conversions between Signals and Observables (toSignal()/toObservable()) unless integrating with existing RxJS APIs.
- Keep signal updates synchronous and deterministic.

## Components

- Keep components focused.
- Prefer inline templates for small components.
- Prefer relative paths for template/style URLs.
- Use the `host` property instead of `@HostBinding` and `@HostListener`.
- Use `NgOptimizedImage` for static assets.
- Prefer adding shared UI components through spartan-ui rather than creating new ones.

## Templates

- Prefer native control flow:

```html
@if (...)
@for (...)
@switch (...)
```

instead of structural directives.

- Avoid complex template logic.
- Use `class` bindings instead of `ngClass`.
- Use `style` bindings instead of `ngStyle`.
- Use the async pipe with Observables.
- Don't assume globals like `new Date()` exist.

## Forms

Prefer Signal Forms (`@angular/forms/signals`).

If Signal Forms aren't appropriate, use Reactive Forms.

Never use Template-driven Forms for new code.

## Services

- One responsibility per service.
- Use `@Service`.
- Singleton services should use `providedIn: 'root'`.
- Use `inject()`.

## State

- Prefer signals.
- Use `computed()` for derived state.
- Never use `mutate()`.
- Use `set()` or `update()`.

## Accessibility

Every UI change must:

- pass AXE
- satisfy WCAG AA
- include keyboard navigation
- have correct focus management
- have appropriate ARIA attributes
- meet contrast requirements

## Repository conventions

When editing the Angular client:

- Match the existing folder structure.
- Reuse existing shared UI components before creating new ones.
- Reuse existing services when possible.
- Follow existing naming conventions.
- Prefer extending existing signal stores rather than introducing new state patterns.