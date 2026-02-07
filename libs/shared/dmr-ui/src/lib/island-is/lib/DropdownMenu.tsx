/* eslint-disable no-console */
'use client'

import { DropdownMenu as IslandDropdownMenu } from '@island.is/island-ui/core/DropdownMenu/DropdownMenu'

export const DropdownMenu = (
  props: React.ComponentProps<typeof IslandDropdownMenu>,
) => {
  const originalConsoleError = console.error

  console.error = (...args) => {
    const culprit = args?.[1]
    if (culprit === 'DropdownMenu' || culprit === 'fill-rule' || culprit === 'clip-rule') {
      // Swallow the error
      return
    }
    originalConsoleError(...args)
  }

  return <IslandDropdownMenu {...props} />
}
