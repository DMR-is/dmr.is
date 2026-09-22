'use client'

import React, { useId } from 'react'

import { Drawer as DrawerBase } from '../../island-is/'

type Props = {
  baseId?: string
  isVisible?: boolean
  disclosure: React.ReactElement
  children?: React.ReactNode
}

export const Drawer = ({
  baseId,
  isVisible = false,
  disclosure,
  children,
}: Props) => {
  // See Modal: a default of '' is falsy, so reakit falls through to its random
  // generator. useId is stable across server and client.
  const fallbackBaseId = useId()
  const resolvedBaseId = baseId || fallbackBaseId

  return (
    <DrawerBase
      ariaLabel={''}
      baseId={resolvedBaseId}
      initialVisibility={isVisible}
      disclosure={disclosure}
    >
      {children}
    </DrawerBase>
  )
}
