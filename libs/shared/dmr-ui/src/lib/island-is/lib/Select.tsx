'use client'

import type { ComponentType } from 'react'

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

export const Select = IslandSelect as unknown as ComponentType<SelectProps>

export type {
  StringOption,
  Option,
} from '@island.is/island-ui/core/Select/Select.types'
