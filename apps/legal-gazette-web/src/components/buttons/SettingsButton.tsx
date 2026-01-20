'use client'

import React from 'react'

import { Button, DropdownMenu } from '@dmr.is/ui/components/island-is'

type SettingsItems = React.ComponentProps<typeof DropdownMenu>['items']

export const SettingsButton = () => {
  const items: SettingsItems = [
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

export default SettingsButton
