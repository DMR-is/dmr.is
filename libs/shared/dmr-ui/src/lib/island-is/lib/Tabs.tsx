'use client'

import dynamic from 'next/dynamic'
const DynamicTabs = dynamic(
  () => import('@island.is/island-ui/core/Tabs/Tabs').then((mod) => mod.Tabs),
  {
    ssr: false,
  },
)

export const Tabs = (props: React.ComponentProps<typeof DynamicTabs>) => {
  const { children, ...rest } = props
  return <DynamicTabs {...rest}>{children}</DynamicTabs>
}
