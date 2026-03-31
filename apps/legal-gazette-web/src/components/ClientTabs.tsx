'use client'

import dynamic from 'next/dynamic'

type TabItem = {
  id: string
  label: string
  content: React.ReactNode
}

type ClientTabsProps = {
  label: string
  selected?: string | null
  onChange: (id: string) => void
  onlyRenderSelectedTab?: boolean
  size?: 'xs' | 'sm' | 'md'
  tabs: TabItem[]
}

const DynamicTabs = dynamic(
  () =>
    import('@dmr.is/ui/components/island-is/Tabs').then((mod) => mod.Tabs),
  {
    ssr: false,
  },
)

export const ClientTabs = (props: ClientTabsProps) => {
  return <DynamicTabs {...props} selected={props.selected ?? undefined} />
}
