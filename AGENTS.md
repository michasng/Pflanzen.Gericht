# Project Guidelines

Vue 3 + Vite + TypeScript SPA.
Package manager: **pnpm**.

## Coding Principles

Always consider these principles.
Write out their names when discussing their trade-offs.

- **You Aren't Gonna Need It (YAGNI)**: Implement only what is required now
- **Low Coupling**: Define contracts with abstractions
- **High Cohesion**: Bundle functionality; prefer local over global scope
- **Separation of Concerns (SoC)**: Separate structure, behavior, and persistence. One entity per file
- **Single Responsibility (SRP)**: Each function, component, or module has one reason to change. Small components, one job each
- **Open/Closed (OCP)**: Extend behavior without modifying existing code
- **Dependency Inversion (DIP)**: Depend on abstractions, not concretions
- **Interface Segregation (ISP)**: Depend on minimal interfaces
- **Inversion of Control (IoC)**: Inject dependencies; never call `new` on services
- **Command-Query Separation (CQS)**: A method either has a side-effect or returns data, but never both; the name indicates which
- **Composition over Inheritance**: Prefer "has a" over "is a"
- **Deep Modules**: Hide complexity behind simple interfaces
- **Self-Documenting Code**: Expressive naming over comments; avoid abbreviations; include units in names (e.g. `timeoutSeconds`)
- **Flat Control Flow**: Use early returns to avoid nesting

## Code Style

- English for code, comments, and commit messages
- TypeScript strict; no `any`, no non-null `!` assertions — model types honestly
- Never suppress type or lint errors
- No type casts unless there is no better option; if unavoidable, add a short comment explaining why
- Only arrow functions; never the `function` keyword
- Prefer enums over union types
- No magic numbers or strings; extract them to named constants or enums
- No comments unless they add meaning the code cannot; then keep them to one short line
- No dead code, commented-out blocks, or leftover `TODO`s
- Vue 3 `<script setup>` with the Composition API and typed props/emits
- Naming: PascalCase components, `use`-prefixed composables, `@/` import alias
- Formatting and lint enforced by oxfmt/oxlint/eslint

## Architecture

- `src/` app code, `src/router/` routing. Keep view/route components thin; extract reusable logic into composables (`useX`)
- One-way data flow: props down, events up. Avoid shared mutable module state
- Treat props and store state as read-only
- Prefer `async`/`await`; always handle loading and error states
- Surface errors to the user (e.g. `AlertMessage`); never swallow them
- Semantic HTML, `alt` text, and keyboard support for interactive components

## Security

- Never commit secrets; use environment variables
- Validate input at boundaries; treat Supabase RLS as the authorization source of truth

## Testing

- All logic must be unit tested (`src/**/__tests__`); add or update tests with every behavior change
- One `describe` block at the top per unit under test
- Nest scenarios with non-technical `given|when <scenario>` describes
- Follow Arrange–Act–Assert
- Keep a minimal shared setup
- Prefer dependency injection over intrusive mocking

## Database

- `src/types/database.ts` is generated — never edit it by hand
- After every schema change: `pnpm db:push:local` then `pnpm db:types:local`

## Workflow

- Atomic changes: reduce every task to the smallest change that makes sense and leaves the app runnable
- Verify every change with `pnpm verify`; the same script runs on every commit

### Commit messages

- Prefix with one of `chore|refactor|fix|patch|feat:` followed by a Capitalized Verb
- Non-technical; first line short with no commas or bullet points
- Optionally a blank line, then more context if it helps

## For the Agent

- Keep responses and diffs minimal; skip restating unchanged code
- Read a file before editing it; verify assumptions with tests rather than guessing
