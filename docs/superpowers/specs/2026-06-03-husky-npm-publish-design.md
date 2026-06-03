# Husky Hooks + npm Publish Design

**Date:** 2026-06-03

---

## Context

Current state:
- `.husky/pre-commit` runs `yarn test` (full suite including E2E — slow for a commit hook)
- No `pre-push` hook
- `version-bump.yml` bumps patch version, creates tag `vX.Y.Z`, pushes on every master merge
- No npm publish workflow exists

---

## Feature 1: Husky Hooks

### Goal

Fast feedback on commit, full safety gate on push.

### Changes

**`.husky/pre-commit`** — replace `yarn test` with `yarn test:unit`

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
yarn test:unit
```

Runs Vitest only (~0.5s). Catches logic errors immediately without blocking flow for 30+ seconds.

**`.husky/pre-push`** — new file

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
yarn test
```

Runs full suite (`yarn test:unit && yarn test:e2e`). Ensures nothing is broken before code reaches remote. E2E requires a webpack build + puppeteer (~30s total).

---

## Feature 2: npm Publish Workflow

### Goal

Manual, intentional npm releases via GitHub Actions UI. Version always auto-increments on master merge (existing behavior); publishing is a separate deliberate step.

### Flow

1. Merge to master → `version-bump.yml` bumps patch version, commits `🚀 vX.Y.Z`, creates tag, pushes
2. Developer decides to release → opens GitHub Actions → runs "Publish to npm" workflow manually (`workflow_dispatch`)
3. Workflow builds the library and publishes to npm registry at the current `package.json` version

### New file: `.github/workflows/npm-publish.yml`

```yaml
name: Publish to npm
on:
  workflow_dispatch:
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          registry-url: 'https://registry.npmjs.org'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Prerequisites

- `NPM_TOKEN` secret must be set in GitHub repo → Settings → Secrets and variables → Actions → New repository secret
- `package.json` `files` field should be set to include only the dist output (if not already)

---

## Out of Scope

- Automatic publish on tag push (rejected in favor of `workflow_dispatch`)
- Changes to `version-bump.yml`
- `package.json` `files` field cleanup (separate concern)
