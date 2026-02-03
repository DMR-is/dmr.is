---
name: codegen
description: Regenerate OpenAPI client code for frontend apps from running API
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [app-name]
---

# Codegen - OpenAPI Client Generation

Regenerates TypeScript API client code for Next.js frontend applications from a running API server.

**Argument:** `$ARGUMENTS` (optional app name, auto-detected if not provided)

## Supported Apps

| App | Target | API Required | Port |
|-----|--------|--------------|------|
| `legal-gazette-web` | `update-client` | legal-gazette-api | 4100 |
| `legal-gazette-public-web` | `update-client` | legal-gazette-api | 4100 |
| `legal-gazette-application-web` | `update-client` | legal-gazette-api | 4100 |
| `official-journal-web` | `update-schema` | official-journal-api | 4000 |

## Workflow

### 1. Determine Target App

**If argument provided:** Use `$ARGUMENTS` as the app name.

**If no argument:** Auto-detect from context:

1. Check current working directory for app name in path
2. Look at recently edited files in conversation
3. Search for files matching `apps/*-web/` pattern

If multiple apps are candidates or detection fails, ask the user which app to use.

### 2. Verify Prerequisites

Before running codegen:

- [ ] Confirm the app has an `update-client` or `update-schema` target (check `project.json`)
- [ ] Remind user that the corresponding API must be running

**API Port Reference:**

- Legal Gazette apps → `legal-gazette-api` on port 4100
- Official Journal apps → `official-journal-api` on port 4000

### 3. Run Codegen

**For Legal Gazette apps** (have `update-client` target):

```bash
yarn nx run <app-name>:update-client
```

This runs:
1. `update-openapi-schema` - Fetches OpenAPI spec from running API
2. `codegen` - Generates TypeScript client in `src/gen/fetch/`

**For Official Journal Web** (has `update-schema` target):

```bash
yarn nx run official-journal-web:update-schema
```

This runs:
1. `update-openapi-schema` - Fetches OpenAPI spec from running API
2. `clean` - Removes old generated files
3. `codegen` - Generates TypeScript client

### 4. Verify Output

After codegen completes:

- [ ] Check that `apps/<app-name>/src/gen/fetch/` was created/updated
- [ ] Report any errors to the user

## Common Issues

### API Not Running

If curl fails with "connection refused":

```
Error: curl: (7) Failed to connect to localhost port 4100
```

**Solution:** Start the API first:

```bash
yarn nx serve legal-gazette-api    # For Legal Gazette apps
yarn nx serve official-journal-api # For Official Journal
```

### Invalid OpenAPI Schema

If codegen fails with parsing errors, the API might have invalid Swagger decorators. Check the API's Swagger endpoint in a browser first.

## Quick Reference

**Commands by app:**

| App | Command |
|-----|---------|
| legal-gazette-web | `nx run legal-gazette-web:update-client` |
| legal-gazette-public-web | `nx run legal-gazette-public-web:update-client` |
| legal-gazette-application-web | `nx run legal-gazette-application-web:update-client` |
| official-journal-web | `nx run official-journal-web:update-schema` |

**Generated files location:** `apps/<app-name>/src/gen/fetch/`
