# Project Guidelines

Vue 3 + Vite + TypeScript SPA. Package manager: **pnpm**.

## Principles

- Favor simple, readable code over cleverness; optimize for the next maintainer.
- Make the smallest change that solves the problem. No unrelated refactors or speculative features (YAGNI).
- Keep functions and components small and single-purpose; prefer composition over inheritance.
- Name things by intent. Avoid abbreviations and comments that restate the code.
- No dead code, commented-out blocks, or `TODO`s left behind.

## Code Style

- TypeScript strict; no `any`, no non-null `!` assertions—model types honestly.
- Vue 3 `<script setup>` with the Composition API and typed props/emits.
- Formatting and lint rules are enforced by oxfmt/oxlint/eslint.

## Architecture

- `src/` app code, `src/router/` routing. Keep view/route components thin; extract reusable logic into composables (`useX`).
- One-way data flow: props down, events up. Avoid shared mutable module state.

## Build and Test

- `pnpm dev` — dev server
- `pnpm test:unit` — Vitest unit tests
- `pnpm type-check` — vue-tsc
- `pnpm lint` — oxlint + eslint (autofix)
- `pnpm build` — production build (runs type-check)

Add or update unit tests (`src/**/__tests__`) for behavior changes. Run `pnpm lint` and `pnpm type-check` before finishing.

## Database

- `src/types/database.ts` is generated — never edit it by hand.
- After every schema change: `pnpm db:push:local` then `pnpm db:types:local`.

## Commit Discipline

- Make atomic commits: one logical change per commit so the app is always in a working state between commits.
- Before every commit run, in order: `pnpm lint` → `pnpm format` → `pnpm test:unit` → `pnpm type-check`.
- Commit messages must be short and non-technical, prefixed by `chore|refactor:`, `fix|patch:`, `feat:`, or `feat!:`. Maximum one short sentence; no body, no bullet points.

## For the Agent

- Keep responses and diffs minimal to conserve tokens; skip restating unchanged code.
- Read a file before editing it; verify assumptions with tests rather than guessing.
