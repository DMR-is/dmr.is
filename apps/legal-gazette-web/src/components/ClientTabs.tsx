'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'

type TabItem = {
  id: string
  label: string
  content: ReactNode
}

type ClientTabsProps = {
  label: string
  selected?: string | null
  onChange: (id: string) => void
  onlyRenderSelectedTab?: boolean
  size?: 'xs' | 'sm' | 'md'
  tabs: TabItem[]
}

export const ClientTabs = (props: ClientTabsProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <Tabs {...props} selected={props.selected ?? undefined} />
}
