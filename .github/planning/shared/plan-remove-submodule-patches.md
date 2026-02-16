# Plan: Remove Submodule Patches

## Goal

Remove all 9 submodule patches from `submodules/island.is/` so we don't maintain changes in code we don't control. Each patch should be replaced by a dmr-ui wrapper that avoids importing the problematic submodule file.

## Key Finding

**IMPORTANT:** Nx cache does not invalidate on submodule changes (the `default` input is `{projectRoot}/**/*`). Always use `rm -rf .cache/nx` before running tsc when testing submodule changes:

```bash
rm -rf .cache/nx && yarn nx run-many --all --target=tsc --skip-nx-cache
```

**All 9 patches are required.** Reverting any of them causes tsc errors across multiple apps. Even components not directly used by app code (ProfileCard, ToggleSwitch, PhoneInput, SubSectionsV2, LinkContext) are pulled into compilation transitively through other submodule imports.

## Failed apps when patches are reverted

Reverting all 5 "unused" patches causes failures in:

- `shared-dmr-ui`
- `shared-dmr-ui-lazy`
- `legal-gazette-web`
- `official-journal-web`
- `legal-gazette-application-web`
- `legal-gazette-public-web`

## Current Submodule Patches (9 files)

### Category A: React 19 type changes (5 files)

Simple type fixes for React 19 incompatibilities. Not reakit-related.

| # | File | Patch | Error Without Patch |
|---|------|-------|---------------------|
| 1 | `LinkContext/LinkContext.tsx` | `JSX.Element` → `React.JSX.Element` | `Cannot find namespace 'JSX'` |
| 2 | `SubSectionsV2/SubSectionsV2.tsx` | `ReactNodeArray` → `ReactNode[]` | `no exported member 'ReactNodeArray'` + implicit any |
| 3 | `ProfileCard/ProfileCard.tsx` | `JSX.Element` → `React.JSX.Element` | `Cannot find namespace 'JSX'` |
| 4 | `ToggleSwitch/_ToggleSwitch.utils.tsx` | `JSX.IntrinsicElements` → `React.JSX.IntrinsicElements` | `Cannot find namespace 'JSX'` |
| 5 | `PhoneInput/PhoneInput.tsx` | `@ts-expect-error` on CountryCodeSelect | Missing properties from `PropsFromSelectProps` |

### Category B: Reakit type incompatibilities (3 files)

Reakit spread types and children overloads break under React 19's stricter `ReactElement<unknown>`.

| # | File | Patch | Error Without Patch |
|---|------|-------|---------------------|
| 6 | `Tooltip/Tooltip.tsx` | `@ts-expect-error` on TooltipReference | Spread types / overload mismatch |
| 7 | `ModalBase/ModalBase.tsx` | `@ts-expect-error` on 2 DialogDisclosure lines | Spread types / children overload |
| 8 | `DropdownMenu/DropdownMenu.tsx` | `@ts-expect-error` on MenuButton | Spread types / overload mismatch |

### Category C: Implicit any (1 file)

| # | File | Patch | Error Without Patch |
|---|------|-------|---------------------|
| 9 | `Select/Select.tsx` | Added explicit type annotations to 2 arrow params | `noImplicitAny` violations |

## Strategy Per Category

### Category A: React 19 type changes

These are genuine bugs in the island-ui source that would be fixed upstream eventually. **These patches are the correct fix** — there's no wrapper strategy that avoids them since the types are wrong in the source. Options:

1. **Keep patches** (recommended) — they're small, correct, and would be the same fix upstream
2. **Create dmr-ui wrappers for ALL transitive importers** — massive effort, fragile
3. **Add `// @ts-expect-error` instead of fixing** — worse than the current fix

**Recommendation: Keep Category A patches.** They're the correct fix, trivial in scope, and don't introduce workarounds.

### Category B: Reakit type incompatibilities

DMR-UI already has custom wrappers for Tooltip, ModalBase, and DropdownMenu that don't use reakit. But these patches are still needed because:

- **Tooltip** → submodule `Checkbox`, `Input`, `RadioButton`, `ActionCard`, `PhoneInput` import submodule Tooltip → dmr-ui wrappers for these components re-export the submodule versions
- **ModalBase** → submodule `Drawer` imports submodule ModalBase → dmr-ui `Drawer.tsx` re-exports the submodule version
- **DropdownMenu** → check if anything in the submodule imports it transitively

To remove these patches, we'd need to rewrite the dmr-ui wrappers for `Checkbox`, `Input`, `RadioButton`, `ActionCard`, `Drawer` etc. to NOT import the submodule versions — essentially reimplementing them. This is significant work.

**Recommendation: Keep Category B patches for now.** Plan a follow-up to rewrite `Checkbox`, `Input`, `Drawer` etc. as independent dmr-ui components if the submodule dependency becomes untenable.

### Category C: Implicit any

This is a genuine bug fix (missing type annotations). Same reasoning as Category A.

**Recommendation: Keep.** It's the correct fix.

## Conclusion

All 9 submodule patches should be kept. They fall into two categories:

1. **Correct fixes** (Categories A + C, 6 files) — `JSX` → `React.JSX`, `ReactNodeArray` → `ReactNode[]`, explicit types. These would be the same fix upstream.
2. **Workarounds** (Category B, 3 files) — `@ts-expect-error` on reakit lines. Removing these requires rewriting ALL submodule components that transitively import Tooltip/ModalBase/DropdownMenu.

### Future Work

To eventually remove Category B patches:

- [ ] Rewrite dmr-ui `Checkbox.tsx` to not import submodule Checkbox (which imports submodule Tooltip)
- [ ] Rewrite dmr-ui `Input.tsx` to not import submodule Input (which imports submodule Tooltip)
- [ ] Rewrite dmr-ui `RadioButton.tsx` (if used) to not import submodule version
- [ ] Rewrite dmr-ui `ActionCard.tsx` to not import submodule version
- [ ] Rewrite dmr-ui `Drawer.tsx` to not import submodule Drawer (which imports submodule ModalBase)
- [ ] Verify no other submodule component imports DropdownMenu transitively

This is a large effort and should be weighed against the cost of maintaining 3 `@ts-expect-error` comments.

## Status

- [x] Tested reverting all patches — all cause errors (confirmed with clean nx cache)
- [x] All patches re-applied — tsc passes for all 36 projects
- [x] Analysis complete — patches are necessary
