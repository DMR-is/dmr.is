'use client'

import dynamic from 'next/dynamic'

import { ReactNode } from 'react'
const DynamicTabs = dynamic(
  () => import('@island.is/island-ui/core/Tabs/Tabs').then((mod) => mod.Tabs),
  {
    ssr: false,
  },
)


export const Tabs = DynamicTabs
export type TabType = {
  /**
   * Required when prop onlyRenderSelectedTab is true
   */
  id?: string
  label: string
  content: ReactNode | Array<TabType>
  disabled?: boolean
}
