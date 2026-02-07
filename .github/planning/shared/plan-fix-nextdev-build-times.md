# Plan: Fix Long Build Times in Legal Gazette Web Apps (`next dev`)

## Summary

Running `next dev` for legal-gazette web apps has very long compile times. This plan addresses the two main bottlenecks with minimal, targeted config changes.

## Root Causes

1. **Barrel file explosion**: `@island.is/island-ui/core` barrel file (`submodules/island.is/libs/island-ui/core/src/index.ts`) has 120+ `export *` re-exports across 146 lines. Every import from this package forces webpack to parse all 673 files in the island-ui source tree.
2. **Vanilla Extract overhead**: The `@vanilla-extract/next-plugin` processes all `.css.ts` files (50+ in island-ui alone) through a webpack child compiler on every compilation, with known performance issues on Apple Silicon.
3. **No dev-mode optimizations**: The Next.js configs have no `optimizePackageImports`, no `modularizeImports`, and no VE plugin tuning.

**Key constraint**: Turbopack (`--turbo`) is **NOT compatible** with vanilla-extract, so that optimization path is blocked.

## Phase 1: Add `optimizePackageImports` (Highest Impact)

Next.js 14.2 (our version: 14.2.35) has SWC-based barrel file optimization that rewrites `import { Box, Stack } from '@island.is/island-ui/core'` to direct module imports at compile time, skipping the barrel file entirely. Vercel benchmarks show 15-70% faster dev compilation depending on the library.

### Files to modify

- `apps/legal-gazette-web/next.config.js`
- `apps/legal-gazette-application-web/next.config.js`
- `apps/legal-gazette-public-web/next.config.js`

### Change

Add `experimental.optimizePackageImports` to the `nextConfig` object:

```javascript
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: [
      '@island.is/island-ui/core',
      '@island.is/island-ui/theme',
    ],
  },
  // ... rest of config unchanged
}
```

### Known risk

There is a [known issue](https://github.com/vercel/next.js/issues/75148) where `optimizePackageImports` may not work correctly with packages resolved via tsconfig path aliases (rather than `node_modules`). Since our `@island.is/*` packages are resolved from `submodules/` via tsconfig paths, this needs testing. If it doesn't work, see Phase 3 (fallback).

## Phase 2: Tune Vanilla Extract Plugin for Dev

The VE plugin has a [known issue](https://github.com/vanilla-extract-css/vanilla-extract/issues/771) where debug class name generation is expensive, especially on Apple Silicon (M1/M2). Setting `identifiers: 'short'` in dev avoids this overhead.

### Files to modify

Same three files as Phase 1.

### Change

Pass options to `createVanillaExtractPlugin`:

```javascript
const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: process.env.NODE_ENV === 'production' ? 'debug' : 'short',
})
```

This generates short hashed class names in dev instead of long debug strings like `ComponentName_styleName__abc123`. The trade-off is slightly harder CSS debugging in dev tools, but significantly faster compilation.

## Phase 3: Fallback — `modularizeImports` (Only If Phase 1 Fails)

If `optimizePackageImports` doesn't work with tsconfig path-aliased packages, use the explicit `modularizeImports` approach instead. This gives manual control over the rewrite rules.

### Files to modify

Same three files. Replace the `experimental.optimizePackageImports` with:

```javascript
const nextConfig = {
  modularizeImports: {
    '@island.is/island-ui/core': {
      transform: 'submodules/island.is/libs/island-ui/core/src/lib/{{member}}/{{member}}',
      skipDefaultConversion: true,
    },
  },
  // ... rest of config
}
```

**Note**: This approach requires that components follow the `ComponentName/ComponentName` directory convention. The island-ui library follows this pattern for most components, but some exports (styles, hooks, types) may need special handling.

## Out of Scope

- **Turbopack**: Not compatible with vanilla-extract ([issue #1367](https://github.com/vanilla-extract-css/vanilla-extract/issues/1367))
- **`experimental.optimizeCss`**: Does not work with App Router (all LG apps use App Router)
- **`transpilePackages`**: `withNx` already handles transpilation of workspace packages
- **Upgrading Next.js**: Staying on 14.2.x as specified

## Verification

1. Run `yarn nx serve legal-gazette-web` and measure initial compilation time (before/after)
2. Make a small edit to a page component and measure hot-reload time (before/after)
3. Verify the app renders correctly — components should look the same
4. Run `yarn nx run legal-gazette-web:tsc` to ensure no type errors
5. Optionally run with `ANALYZE=true` to compare bundle sizes before/after

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: optimizePackageImports | Pending | |
| Phase 2: VE plugin tuning | Pending | |
| Phase 3: modularizeImports fallback | Pending | Only if Phase 1 fails |
