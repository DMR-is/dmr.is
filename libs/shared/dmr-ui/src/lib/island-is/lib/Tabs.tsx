'use client'

import dynamic from 'next/dynamic'
const DynamicTabs = dynamic(
  () => import('@island.is/island-ui/core/Tabs/Tabs').then((mod) => mod.Tabs),
  {
    ssr: false,
  },
)

export const Tabs = DynamicTabs
