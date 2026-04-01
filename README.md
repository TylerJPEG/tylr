# tylr

`tylr` is a foundation for tracking the moving parts of everyday life without locking the project into a UI or database decision too early.

## Current shape

- A small domain model for things you want to track: notes, tasks, habits, events, and metrics.
- A service layer that applies business rules and can be reused by a future CLI, API, or dashboard.
- A JSON-file repository so the project is immediately usable without infrastructure.
- Tests that cover the core service and persistence behavior.
- A dedicated Instagram caption subsystem for seeding past posts and generating on-brand caption ideas.

## Project structure

```text
src/
  core/             application logic and interfaces
  domain/           shared domain types
  infrastructure/   concrete persistence
tests/              behavior tests
data/               local JSON storage
```

## Getting started

```bash
npm install
npm run test
npm run dev
```

## Why this foundation

The project is intentionally split into layers:

- `domain` stays stable even if storage or UI changes.
- `core` owns the operations your app supports.
- `infrastructure` is replaceable; JSON today, SQLite/Postgres/API later.

That gives you room to add:

- a dashboard or web UI
- a CLI
- recurring jobs or reminders
- analytics and reporting
- richer storage backends

## Instagram caption foundation

There is now a dedicated subsystem for your Instagram workflow:

- Historical post seeding: import past captions into a local workspace file and infer an initial voice profile.
- Maintainable voice rules: store explicit tone, grammar, structure, and avoidance rules that can grow over time.
- Direction-based generation: take a new post idea and generate caption candidates using the seeded profile plus your manual rules.

Relevant files:

- `src/domain/instagram.ts`
- `src/core/instagram-caption-studio.ts`
- `src/infrastructure/json-file-instagram-repository.ts`
- `src/scripts/seed-instagram.ts`
- `src/scripts/set-instagram-direction.ts`
- `src/scripts/sync-instagram-rules.ts`
- `src/scripts/generate-instagram-captions.ts`
- `data/instagram-direction.json`
- `data/instagram-manual-rules.json`
- `data/instagram-brief.example.json`
- `data/instagram-posts.seed.json`
- `data/instagram-posts.example.json`
- `docs/instagram-caption-workflow.md`
- `prompts/instagram-caption-agent-prompt.md`

### Intended process

1. Seed the system with historical posts you want the project to learn from.
2. Define the forward-looking direction you actually want, separate from whatever your past captions happened to do.
3. Review the inferred profile and add manual rules for things analysis cannot infer reliably.
4. Feed in a new caption direction brief and generate a few candidate captions.
5. Keep refining the rules as your taste evolves.

### Seeding your real posts

Your first real seed set now lives in `data/instagram-posts.seed.json`.

Run:

```bash
npm run seed:instagram
```

That writes the current inferred workspace to `data/instagram-workspace.json`.

### Setting the editorial direction

Your forward-looking philosophy now lives in `data/instagram-direction.json`.

Run:

```bash
npm run set:instagram-direction
```

This updates the workspace so generation can privilege your intended direction, not just historical habits.

### Syncing manual editorial rules

Your explicit editorial rules now live in `data/instagram-manual-rules.json`.

Run:

```bash
npm run sync:instagram-rules
```

This layers your music-first philosophy into the workspace as maintainable manual rules.

### Generating caption ideas from a brief

Create `data/instagram-brief.json` or start from `data/instagram-brief.example.json`, then run:

```bash
npm run generate:instagram-captions
```

That reads the brief, applies the seeded voice, direction, and manual rules, and prints caption candidates.

### Conversation-first workflow

This feature is intended to run as a conversational process with Codex, not a fixed automation.

- Workflow note: `docs/instagram-caption-workflow.md`
- Canonical agent prompt: `prompts/instagram-caption-agent-prompt.md`

The prompt is the main entrypoint. The scripts are helpers, not the product.

### What the seed captures

- recurring phrases
- common openers and closers
- recurring hashtags
- rough caption length habits
- punctuation and emoji tendencies
- CTA frequency

### What still needs your judgment

- what should never be said
- vocabulary that feels too polished, too generic, or too online
- how much experimentation you want versus strict consistency
- which historical posts represent your current voice

## Next reasonable steps

1. Decide which tracked items matter most first, then deepen those workflows.
2. Add commands or HTTP endpoints around the existing service.
3. Introduce a database only when file-based persistence becomes limiting.
