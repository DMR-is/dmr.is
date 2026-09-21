'use client'

import { type ComponentType, useId } from 'react'

import { Select as IslandSelect } from '@island.is/island-ui/core/Select/Select'

/**
 * Minimal props type for the Select wrapper.
 * We type onChange here to prevent noImplicitAny errors,
 * The index signature allows all other island-ui Select props through.
 */
export type SelectProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (option: { label: string; value: any } | null) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const IslandSelectTyped = IslandSelect as unknown as ComponentType<SelectProps>

/**
 * island-ui's Select, with a guaranteed-stable element id.
 *
 * react-select falls back to an auto-incrementing counter for its internal
 * element ids when it is given no `instanceId`, and island-ui takes that
 * `instanceId` from `id`, which in turn defaults to `name`. Pass neither and
 * the counter decides - so the id depends on how many Selects the module has
 * built, which differs between the server render and the client one.
 *
 * Hydration then reports mismatched `id` and `aria-*` attributes, and React
 * does not patch attribute mismatches up: the DOM keeps the server's ids while
 * `aria-labelledby` and `aria-activedescendant` point at the client's, leaving
 * the accessibility wiring aimed at elements that do not exist.
 *
 * `useId` is stable across both renders by construction. A caller that already
 * passes a non-empty `id` or `name` keeps exactly the id it had.
 *
 * Note the truthiness check rather than `??`: react-select resolves its prefix
 * as `instanceId || ++counter`, so an empty string falls through to the counter
 * just as `undefined` does. No caller passes an empty `id` or `name` today, so
 * that arm is defensive rather than load-bearing - but `??` would silently stop
 * guarding the moment one did.
 *
 * This only covers Selects rendered *through this wrapper*. island-ui's `Tabs`
 * renders its own internal `<Select name={label} />` imported straight from
 * `island-ui/core` (`Tabs/Tabs.tsx`), so a `Tabs` given `label=""` still gets
 * counter-derived ids and this file cannot help it. Give those a real `label`.
 */
export const Select = ({ id, name, ...props }: SelectProps) => {
  const fallbackId = useId()

  return (
    <IslandSelectTyped id={id || name || fallbackId} name={name} {...props} />
  )
}

export type {
  StringOption,
  Option,
} from '@island.is/island-ui/core/Select/Select.types'
