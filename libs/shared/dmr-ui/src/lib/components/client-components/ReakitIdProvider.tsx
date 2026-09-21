'use client'

// Aliased to a capitalised name: JSX treats a lowercase tag name as an
// intrinsic HTML element, so `<unstable_IdProvider>` would render a <unstable_idprovider>
// element and silently apply no provider at all.
import { unstable_IdProvider as IdProvider } from 'reakit/Id'

/**
 * Makes the ids that reakit generates deterministic across server and client.
 *
 * Without a provider, reakit falls back to `Math.random()` for every base id
 * (see `reakit/Id/IdProvider`), so components built on it — island-ui's `Tabs`,
 * which calls `useTabState()` without a `baseId` — render one id on the server
 * and a different one on the client. React does not patch attribute mismatches,
 * which leaves `aria-controls` on each tab pointing at an id that is not in the
 * document. This provider swaps the random generator for a per-tree counter,
 * which walks the tree in the same order on both sides.
 *
 * Mount it once, around everything that renders island-ui components.
 *
 * Note: under React StrictMode the development-only double render still drifts
 * reakit's per-component id suffix, because `reakit/Id/Id` increments a ref
 * inside a `useState` initializer rather than going through this generator.
 * That is dev-only noise — production renders once and matches. It goes away
 * with the move to ariakit.
 */
export const ReakitIdProvider = ({
  children,
}: {
  children: React.ReactNode
}) => <IdProvider>{children}</IdProvider>
