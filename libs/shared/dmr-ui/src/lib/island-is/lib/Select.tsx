'use client'

import dynamic from 'next/dynamic'

import type { ComponentType } from 'react'

/**
 * Minimal props type for the Select wrapper.
 * next/dynamic erases the generic type from the island-ui Select,
 * so we type onChange here to prevent noImplicitAny errors.
 * The index signature allows all other island-ui Select props through.
 */
export type SelectProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (option: { label: string; value: any } | null) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const DynamicSelect = dynamic(
  () =>
    import('@island.is/island-ui/core/Select/Select').then(
      (mod) => mod.Select,
    ),
  {
    ssr: false,
  },
)

export const Select = DynamicSelect as unknown as ComponentType<SelectProps>

export type { StringOption, Option } from '@island.is/island-ui/core/Select/Select.types'
