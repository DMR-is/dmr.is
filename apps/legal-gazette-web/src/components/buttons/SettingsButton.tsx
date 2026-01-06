import React from 'react'

import { DropdownMenu } from '@dmr.is/ui/components/island-is'

type SettingsItems = React.ComponentProps<typeof DropdownMenu>['items']

export const SettingsButton = () => {
  const items: SettingsItems = [
    {
      title: 'Reikningsviðskipti',
      href: '/stillingar/tbr',
      icon: 'wallet',
      iconType: 'outline',
    },
  ]

  return <DropdownMenu icon="settings" iconType="outline" items={items} />
}
