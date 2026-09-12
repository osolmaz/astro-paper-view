# Contributor instructions

Use Node 22.12 or later and the pinned pnpm version. Install with
`pnpm install --frozen-lockfile`. Before submitting code, run these checks.

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:mutation
pnpm dry
pnpm quality
pnpm build
pnpm test:browser
```

Keep TypeScript strict and reject explicit `any` and unsafe type operations.
Add tests for changed behavior. Do not lower coverage or mutation thresholds.
Follow the [Slophammer standards](https://github.com/osolmaz/slophammer/blob/main/docs/AGENT_ENTRYPOINT.md).

Keep content in one live DOM node when switching views. Preserve form state,
listeners, focus, URL parameters, and the host page when leaving or navigating.
Fonts and styles must load from the package without a CDN or host asset paths.
Keep site-specific styles in the consuming site. Keep browser code under
`src/client`, with no imports from framework components.
