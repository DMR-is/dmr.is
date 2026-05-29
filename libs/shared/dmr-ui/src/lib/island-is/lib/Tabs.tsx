'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { Tabs as IslandTabs } from '@island.is/island-ui/core/Tabs/Tabs'
import { Box } from '@island.is/island-ui/core/Box/Box'
import { Select } from '@island.is/island-ui/core/Select/Select'
import { theme } from '@island.is/island-ui/theme'

export type TabType = {
  /**
   * Required when prop onlyRenderSelectedTab is true
   */
  id?: string
  label: string
  content: ReactNode | Array<TabType>
  disabled?: boolean
}

type TabsProps = {
  label: string
  selected?: string
  tabs: TabType[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentBackground?: any
  size?: 'xs' | 'sm' | 'md'
  onChange?: (id: string) => void
  onlyRenderSelectedTab?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variant?: any
}

// The island.is Tabs uses react-use's useWindowSize which initializes with
// Infinity on SSR and only updates on actual resize events — so it always
// shows desktop layout on mobile after a hard reload. We detect the viewport
// ourselves and render a Select dropdown for mobile instead.
export const Tabs = ({
  label,
  selected = '0',
  tabs,
  contentBackground = 'purple100',
  size = 'md',
  onChange,
  onlyRenderSelectedTab,
  variant = 'default',
}: TabsProps) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const breakpoint =
      tabs.length < 3 ? theme.breakpoints.md : theme.breakpoints.lg
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [tabs.length])

  // island.is always uses desktop layout when there are exactly 2 tabs
  const useMobileLayout = isMobile && tabs.length !== 2

  if (!useMobileLayout) {
    return (
      <IslandTabs
        label={label}
        selected={selected}
        tabs={tabs}
        contentBackground={contentBackground}
        size={size}
        onChange={onChange}
        onlyRenderSelectedTab={onlyRenderSelectedTab}
        variant={variant}
      />
    )
  }

  const selectOptions = tabs.map(({ label, disabled, id }, index) => ({
    label,
    disabled,
    value: id ?? index.toString(),
  }))

  const activeTab = tabs.find((t) => t.id === selected) ?? tabs[0]
  const activeContent = Array.isArray(activeTab?.content) ? null : activeTab?.content

  return (
    <Box position="relative">
      <Box background={contentBackground} position="absolute" style={{ top: 0, bottom: 0, left: 0, right: 0 }} />
      <Box position="relative">
        <Box paddingBottom={2}>
          <Select
            size={size}
            name={label}
            label={label}
            onChange={(opt: { value: string } | null) =>
              opt && onChange?.(opt.value)
            }
            options={selectOptions}
            value={
              selectOptions.find((o) => o.value === selected) ??
              selectOptions[0]
            }
            isSearchable={false}
          />
        </Box>
        <Box background={contentBackground}>{activeContent}</Box>
      </Box>
    </Box>
  )
}
