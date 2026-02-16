# Next.js 16 / React 19 Migration — Reakit Removal & Type Fixes

## Context

Branch: `test/next-16` — Next.js 16.1.6, React 19.2.4

After upgrading, `yarn nx run legal-gazette-web:tsc` produced **14 TypeScript errors**, all from island-ui submodule files. The root causes were:

1. **Reakit 1.3.11 incompatible with React 19** — only supports React 16-17, types break under React 19's stricter type system
2. **React 19 removed/moved types** — `React.ReactNodeArray` removed, `JSX` namespace moved to `React.JSX`
3. **React 19 `ReactElement<unknown>`** — default generic changed from `any` to `unknown`, breaking `React.cloneElement` patterns
4. **Implicit `any` types** in Select.tsx from react-select

## What Was Done (legal-gazette-web)

### Phase 1: Submodule Patches (minimal, unavoidable)

These files are transitively imported by other submodule components (Checkbox imports Tooltip, Drawer imports ModalBase, etc.), so they can't be avoided by rewriting wrappers alone.

| File | Change | Why |
|------|--------|-----|
| `LinkContext/LinkContext.tsx` | `JSX.Element` → `React.JSX.Element` | React 19 moved JSX namespace |
| `SubSectionsV2/SubSectionsV2.tsx` | `ReactNodeArray` → `ReactNode[]` | React 19 removed `ReactNodeArray` |
| `Select/Select.tsx` | Added explicit `OptionType<Value>` and `string` types to 2 arrow params | Implicit `any` under `noImplicitAny` |
| `ModalBase/ModalBase.tsx` | `@ts-expect-error` on 2 reakit-incompatible lines (spread types + children overload) | Reakit types incompatible with React 19 |
| `Tooltip/Tooltip.tsx` | `@ts-expect-error` on 1 reakit-incompatible line (TooltipReference spread) | Reakit types incompatible with React 19 |

### Phase 2: Custom Wrappers in dmr-ui (replaces reakit)

Rewrote the dmr-ui wrapper layer (`libs/shared/dmr-ui/src/lib/island-is/lib/`) to provide equivalent functionality without importing reakit-dependent island-ui source files.

#### Tooltip → CSS-based

- **File:** `Tooltip.tsx` + `Tooltip.css.ts`
- **Approach:** Pure CSS tooltip using `:hover` / `:focus-within` on a container
- **Props kept:** `text`, `placement`, `iconSize`, `color`, `children`, `as`, `fullWidth`
- **Key detail:** Imports `Icon` directly from `@island.is/island-ui/core/IconRC/Icon` (no reakit)
- **Used by:** `AdvertsInProgress.tsx`, `ToggleTBRStatus.tsx`

#### DropdownMenu → useState + click-outside

- **File:** `DropdownMenu.tsx` + `DropdownMenu.css.ts`
- **Approach:** `useState` for open/close, `useRef` + document click listener for click-outside, `useEffect` for Escape key
- **Props kept:** `items` (with `href`/`onClick`/`title`/`icon`/`iconType`/`render`/`noStyle`), `title`, `icon`, `iconType`, `disclosure`, `menuLabel`, `openOnHover`, `loading`, `disabled`, `menuClassName`
- **Key detail:** `onClick` signature simplified to `(event: MouseEvent<HTMLElement>) => void` (nobody used reakit's `MenuStateReturn` second param). `disclosure` typed as `ReactElement<any>` to avoid React 19's `ReactElement<unknown>` issue with `cloneElement`.
- **CSS:** Matches original island-ui styling — eyebrow text variant (12px mobile, 14px desktop, semiBold), centered text, blue100 dividers, blue400 hover
- **Exports `DropdownMenuProps`** — Header.tsx imports this type from the wrapper instead of from submodule
- **Used by:** `MenuButton.tsx`, `CreateAdvertMenu.tsx`, `Header.tsx` (×2)

#### ModalBase → Native `<dialog>` element

- **File:** `ModalBase.tsx` + `ModalBase.css.ts`
- **Approach:** Native `<dialog>` with `showModal()`/`close()`. Reference: `ParallelModal.tsx` already uses this pattern.
- **Props kept:** `baseId`, `isVisible`, `onVisibilityChange`, `disclosure`, `hideOnClickOutside`, `hideOnEsc`, `className`, `children` (supports render function `({closeModal}) => ...`), `toggleClose`, `initialVisibility`, `removeOnClose`, `backdropWhite`, `modalLabel`, `tabIndex`, `preventBodyScroll`
- **Key details:**
  - `<dialog>` provides built-in: backdrop (`::backdrop`), focus trapping, Escape handling
  - `hideOnClickOutside` implemented by checking if click target is the dialog element itself (backdrop area)
  - `onVisibilityChange` skips first render using `useRef` flag (replaces `react-use`'s `useUpdateEffect`)
  - `disclosure` typed as `ReactElement<any>` for React 19 compatibility
  - Body scroll lock managed manually via `document.body.style.overflow`
- **Used by:** `Modal.tsx` → 8+ components in legal-gazette-web

### Phase 3: Removed Direct Reakit Imports

| File | Change |
|------|--------|
| `Layout.tsx` | Removed `import { Provider } from 'reakit'` and `<Provider>` wrapper. Reakit Provider only configured reakit's internal ID system — not needed. |
| `FilterMenu.tsx` | Replaced reakit `Popover`/`PopoverDisclosure`/`usePopoverState` with `useState` + click-outside pattern. Uses `position: absolute` dropdown (note: original reakit Popover used portal + fixed positioning — this is a known behavioral difference, acceptable for now). |
| `ControlPanel.tsx` | Replaced reakit `Popover`/`PopoverDisclosure`/`usePopoverState` with `useState` + click-outside. Uses native `<button>` instead of `<PopoverDisclosure>`. |
| `Header.tsx` | Changed `import type { DropdownMenuProps }` from submodule to local wrapper (`../../island-is/lib/DropdownMenu`) |

## Known Differences from Original

1. **FilterMenu positioning:** Original reakit Popover used portal rendering with fixed viewport positioning (stayed pinned while scrolling). Current implementation uses `position: absolute` relative to the button — scrolls with the page. Functionally equivalent, minor visual difference when scrolling with menu open.

2. **Tooltip animation:** Original had a 250ms fade-in/out animation via reakit's `animated` state + CSS transitions. New version shows/hides instantly on hover. Could add CSS transitions if needed.

3. **ModalBase animation:** Original had 250ms opacity fade transitions. Native `<dialog>` doesn't animate by default. The `::backdrop` also doesn't transition. CSS animations could be added to the dialog if needed.

## What Still Uses Reakit

**Do NOT remove reakit from `package.json` yet.** These still depend on it:

### In submodule (compiled but not our code):

- `Button.tsx` — uses `reakit/Button` (no type errors, works fine)
- `ModalBase.tsx` — still uses reakit internally (patched with `@ts-expect-error`)
- `Tooltip.tsx` — still uses reakit internally (patched with `@ts-expect-error`)
- `Drawer.tsx` — imports ModalBase which uses reakit
- `Checkbox.tsx`, `Input.tsx`, `RadioButton.tsx`, `ActionCard.tsx`, `PhoneInput.tsx` — import Tooltip which uses reakit

### In official-journal-web (5 files, separate effort):

These files still import reakit directly and need the same treatment:

```bash
grep -r "from 'reakit" apps/official-journal-web/
```

## Applying to Other Applications

When migrating another app (e.g., `official-journal-web`, `legal-gazette-application-web`):

### 1. Submodule patches are already applied

The submodule patches (Phase 1) are shared across all apps. No additional work needed.

### 2. Check if the app uses dmr-ui wrappers or imports directly

```bash
# Find direct reakit imports
grep -r "from 'reakit" apps/<app-name>/

# Find submodule imports that bypass wrappers
grep -r "from '@island.is/island-ui/core/DropdownMenu" apps/<app-name>/
grep -r "from '@island.is/island-ui/core/Tooltip" apps/<app-name>/
grep -r "from '@island.is/island-ui/core/ModalBase" apps/<app-name>/
```

### 3. For each direct reakit import, apply the same pattern

- **`reakit` Provider** → Just remove the wrapper
- **`reakit` Popover** → `useState` + click-outside + Escape key (see FilterMenu.tsx or ControlPanel.tsx)
- **`reakit` Menu/MenuButton/MenuItem** → Already handled by DropdownMenu wrapper
- **`reakit` Dialog** → Already handled by ModalBase wrapper
- **`reakit` Tooltip** → Already handled by Tooltip wrapper

### 4. Run tsc to verify

```bash
yarn nx run <app-name>:tsc
```

## File Reference

| File | Purpose |
|------|---------|
| `libs/shared/dmr-ui/src/lib/island-is/lib/Tooltip.tsx` | Custom CSS tooltip |
| `libs/shared/dmr-ui/src/lib/island-is/lib/Tooltip.css.ts` | Tooltip styles |
| `libs/shared/dmr-ui/src/lib/island-is/lib/DropdownMenu.tsx` | Custom dropdown menu |
| `libs/shared/dmr-ui/src/lib/island-is/lib/DropdownMenu.css.ts` | Dropdown styles |
| `libs/shared/dmr-ui/src/lib/island-is/lib/ModalBase.tsx` | Custom native dialog modal |
| `libs/shared/dmr-ui/src/lib/island-is/lib/ModalBase.css.ts` | Modal backdrop styles |
| `libs/shared/dmr-ui/src/lib/components/ControlPanel/ControlPanel.tsx` | Popover → useState |
| `apps/legal-gazette-web/src/layout/Layout.tsx` | Removed reakit Provider |
| `apps/legal-gazette-web/src/components/FilterMenu/FilterMenu.tsx` | Popover → useState |
| `apps/legal-gazette-web/src/components/FilterMenu/FilterMenu.css.ts` | Added dropdown wrapper style |
| `libs/shared/dmr-ui/src/lib/components/Header/Header.tsx` | Type import fix |
