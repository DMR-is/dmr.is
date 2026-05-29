'use client'

import { ReactNode } from 'react'

export { Tabs } from '@island.is/island-ui/core/Tabs/Tabs'
export type TabType = {
  /**
   * Required when prop onlyRenderSelectedTab is true
   */
  id?: string
  label: string
  content: ReactNode | Array<TabType>
  disabled?: boolean
}
