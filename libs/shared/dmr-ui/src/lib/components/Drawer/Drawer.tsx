'use client'

import React from 'react'

import { Drawer as DrawerBase } from '../../island-is/'

type Props = {
  baseId?: string
  isVisible?: boolean
  disclosure: React.ReactElement
  children?: React.ReactNode
}

export const Drawer = ({
  baseId = '',
  isVisible = false,
  disclosure,
  children,
}: Props) => {
  return (
    <DrawerBase
      ariaLabel={''}
      baseId={baseId}
      initialVisibility={isVisible}
      disclosure={disclosure}
    >
      {children}
    </DrawerBase>
  )
}
