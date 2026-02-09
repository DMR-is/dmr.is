'use client'

import React from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DropdownMenu } from '@dmr.is/ui/components/island-is/DropdownMenu'

type MenuItems = React.ComponentProps<typeof DropdownMenu>['items']

export const MenuButton = () => {
  const items: MenuItems = [
    {
      title: 'Reikningsviðskipti',
      href: '/stillingar/tbr',
      icon: 'wallet',
      iconType: 'outline',
    },
    {
      title: 'Ritstjórar',
      href: '/stillingar/ritstjorar',
      icon: 'person',
      iconType: 'outline',
    },
    {
      title: 'Áskrifendur',
      href: '/stillingar/askrifendur',
      icon: 'people',
      iconType: 'outline',
    },
    {
      title: 'Greiðslur',
      href: '/greidslur',
      icon: 'card',
      iconType: 'outline',
    },
  ]

  const disclosure = <Button size="small" variant="utility" icon="dots" />

  return (
    <DropdownMenu disclosure={disclosure} iconType="outline" items={items} />
  )
}

export default MenuButton
