# Plan: Consistent tsconfig via Layered Presets

## Summary

Create root-level tsconfig presets for each project type (NestJS, Next.js, lib, spec) that extend `tsconfig.base.json`. Migrate all apps and libs (except `regulations-api`) to extend the appropriate preset, eliminating duplicated and inconsistent `compilerOptions`. Strict relaxations (`noImplicitAny: false`, etc.) remain as per-project overrides with TODO markers for incremental removal.

**Root cause being solved**: Shared library code (e.g., `@dmr.is/shared-types`) gets type-checked under different `compilerOptions` depending on which app imports it. This causes errors to appear in one app but not another — specifically, `legal-gazette-api` sets `strictNullChecks: false` (via overrides), which breaks discriminated union narrowing that works fine when the lib is checked standalone under `strict: true`.

**Constraints**:

- Do NOT use TypeScript Project References (`composite: true`) — we use Yarn workspace linking
- Do NOT add `@dmr.is/*` to `paths` in `tsconfig.base.json` — resolved via Yarn workspaces
- Keep `@island.is/*` path aliases in `tsconfig.base.json` (git submodules)
- `regulations-api` stays standalone (Fastify app with different needs)

## Preset Hierarchy

```text
tsconfig.base.json                    ← shared compilerOptions, strict: true, nodenext
  ├── tsconfig.preset-nestjs.json     ← target: es2021, decorators, types: [node]
  ├── tsconfig.preset-nextjs.json     ← jsx: preserve, module: esnext, bundler
  ├── tsconfig.preset-lib.json        ← declaration: true, types: [node]
  └── tsconfig.preset-spec.json       ← types: [jest, node]
```

## Steps

### Phase 1: Create Root Presets

- [ ] **1.1** Create `tsconfig.preset-nestjs.json` at repo root extending `tsconfig.base.json`:
  - `target: "es2021"`
  - `emitDecoratorMetadata: true`
  - `experimentalDecorators: true`
  - `removeComments: true`
  - `sourceMap: true`
  - `types: ["node"]`
  - `declaration: false`

- [ ] **1.2** Create `tsconfig.preset-nextjs.json` at repo root extending `tsconfig.base.json`:
  - `jsx: "preserve"`
  - `module: "esnext"`
  - `moduleResolution: "bundler"`
  - `allowJs: true`
  - `noEmit: true`
  - `resolveJsonModule: true`
  - `isolatedModules: true`
  - `incremental: true`
  - `skipLibCheck: true`
  - `plugins: [{ "name": "next" }]`
  - `types: ["jest", "node"]`
  - `lib: ["dom", "dom.iterable", "esnext"]`

- [ ] **1.3** Create `tsconfig.preset-lib.json` at repo root extending `tsconfig.base.json`:
  - `declaration: true`
  - `types: ["node"]`

- [ ] **1.4** Create `tsconfig.preset-spec.json` at repo root extending `tsconfig.base.json`:
  - `types: ["jest", "node"]`

### Phase 2: Migrate NestJS Apps

Each app's `tsconfig.app.json` extends appropriate preset instead of `./tsconfig.json`. Only per-project overrides remain.

- [ ] **2.1** `apps/legal-gazette-api/tsconfig.app.json` → extend `../../tsconfig.preset-nestjs.json`
  - Keep `noImplicitAny: false`, `strictBindCallApply: false` (add `// TODO: remove strict relaxations`)
  - Remove redundant: `module`, `moduleResolution`, `allowSyntheticDefaultImports`, `experimentalDecorators`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch`, `removeComments`, `sourceMap`
  - Keep: `outDir`

- [ ] **2.2** `apps/official-journal-api/tsconfig.app.json` → extend preset
  - Remove redundant `target`, `types`
  - Flag cross-app include (`../official-journal-admin-api/src/filters.ts`) for separate resolution
  - Keep: `outDir`

- [ ] **2.3** `apps/official-journal-admin-api/tsconfig.app.json` → extend preset
  - Remove ALL redundant explicit strict flags (`strictNullChecks: true`, `noImplicitAny: true`, `strictBindCallApply: true`, etc.)
  - Keep: `outDir`

- [ ] **2.4** `apps/official-journal-application-api/tsconfig.app.json` → extend preset
  - Remove redundant settings
  - Keep: `outDir`

- [ ] **2.5** `apps/official-journal-api-export/tsconfig.app.json` → extend preset
  - Remove redundant settings
  - Keep: `outDir`

### Phase 3: Migrate Next.js Apps

Each app's `tsconfig.json` extends preset instead of `../../tsconfig.base.json`. Only project-specific `include`/`exclude` paths remain.

- [ ] **3.1** `apps/legal-gazette-web/tsconfig.json` → extend `../../tsconfig.preset-nextjs.json`
  - Remove all duplicated compilerOptions
  - Keep: `include`, `exclude` (app-specific paths)

- [ ] **3.2** `apps/legal-gazette-application-web/tsconfig.json` → extend preset
  - Same cleanup
  - Create missing `tsconfig.spec.json`

- [ ] **3.3** `apps/legal-gazette-public-web/tsconfig.json` → extend preset

- [ ] **3.4** `apps/official-journal-web/tsconfig.json` → extend preset

### Phase 4: Migrate Libraries

Each lib's `tsconfig.json` continues extending `tsconfig.base.json`. Each lib's `tsconfig.lib.json` extends local `./tsconfig.json`, and removes settings now inherited from base or lib preset pattern.

- [ ] **4.1** Normalize all lib `tsconfig.lib.json` files:
  - Ensure `declaration: true` is set (uncomment in `shared/decorators`, add where missing)
  - Remove redundant `module`/`moduleResolution` from `shared/types/types`
  - Remove duplicated compilerOptions from `shared/trpc` `tsconfig.lib.json`
  - Standardize `types: ["node"]` across all libs

- [ ] **4.2** Remove inconsistent extra strict flags from individual libs:
  - `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`
  - Either promote ALL to `tsconfig.base.json` (preferred if desired globally) or remove from individual libs
  - Affected: `~10 libs` including shared/modules, shared/interceptors, shared/utils/*, shared/constants, shared/dto, logging-next, mocks, apm

- [ ] **4.3** Normalize `extends` targets — all should use `tsconfig.base.json` directly:
  - `libs/apm/tsconfig.json`: change from `../../tsconfig.json` to `../../tsconfig.base.json`

### Phase 5: Normalize Extension Targets (Apps)

- [ ] **5.1** `apps/official-journal-api/tsconfig.json` → change from `../../tsconfig.json` to `../../tsconfig.base.json`
- [ ] **5.2** `apps/official-journal-api-export/tsconfig.json` → same
- [ ] **5.3** `apps/legal-gazette-api/tsconfig.json` → change from `../../tsconfig.json` to `../../tsconfig.base.json`

### Phase 6: Fix Anomalies

- [ ] **6.1** Fix `unwrap()` in `libs/shared/types/types/src/lib/types.ts`:
  - Assign `this.result` to local `const result`
  - Use `result.ok === true` instead of truthiness check

- [ ] **6.2** Fix double-slash typo in `apps/official-journal-api-export-e2e/tsconfig.spec.json` `outDir`

- [ ] **6.3** Address `esModuleInterop: false` overrides in island.is-derived libs:
  - `libs/shared/dmr-ui`, `libs/shared/island-auth-nest`, `libs/shared/island-regulations`, `libs/shared/island-ui-theme`
  - Assess if `false` is intentional (submodule compatibility) or accidental

- [ ] **6.4** Address cross-app file include in `official-journal-api/tsconfig.app.json`:
  - `../official-journal-admin-api/src/filters.ts` should be extracted to a shared lib

### Phase 7: Documentation

- [ ] **7.1** Add tsconfig convention section to `.claude/CLAUDE.md` OR create `.claude/conventions/tsconfig.md`:
  - Preset hierarchy diagram
  - Rules: extend appropriate preset, no strict relaxations without TODO, no `composite`/project references
  - Per-project overrides: only `outDir` and temporary strict relaxations

## Verification

```bash
# Verify effective config for each preset
npx tsc -p tsconfig.preset-nestjs.json --showConfig
npx tsc -p tsconfig.preset-nextjs.json --showConfig
npx tsc -p tsconfig.preset-lib.json --showConfig

# Run tsc across all migrated projects — should produce same (or fewer) errors
yarn nx run-many --target=tsc --exclude=regulations-api

# Verify shared lib consistency — should produce identical results
yarn nx run shared-types-types:tsc
yarn nx run legal-gazette-api:tsc

# Check for remaining redundant settings
grep -r "emitDecoratorMetadata\|experimentalDecorators\|strictNullChecks\|strictBindCallApply" apps/*/tsconfig*.json
```

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preset naming | `tsconfig.preset-*.json` | Avoids collision with per-project `tsconfig.lib.json` files |
| Strict rollout | Incremental | `legal-gazette-api` keeps `noImplicitAny: false` etc. with TODO markers |
| regulations-api | Standalone | Fastify app with different needs, user preference |
| Extra strict flags | Do not promote yet | Decide separately whether to add to `tsconfig.base.json` |
| Next.js `lib` | Upgrade to `esnext` | Aligns with base `es2022`, prevents shared lib type mismatches |
| Project linking | Yarn workspaces only | No `composite`, no `paths` for `@dmr.is/*`, per user requirement |
| Cross-app include | Separate issue | Extract `filters.ts` to shared lib is out of scope |

## Status

| Phase | Status |
|-------|--------|
| Phase 1: Create Root Presets | ✅ Complete |
| Phase 2: Migrate NestJS Apps | ✅ Complete |
| Phase 3: Migrate Next.js Apps | ✅ Complete |
| Phase 4: Migrate Libraries | ✅ Complete |
| Phase 5: Normalize Extensions | ✅ Complete |
| Phase 6: Fix Anomalies | ✅ Complete |
| Phase 7: Documentation | ✅ Complete |
