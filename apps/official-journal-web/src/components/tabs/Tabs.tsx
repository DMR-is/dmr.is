import { useEffect, useState } from 'react'
import { Tab, TabList, TabPanel, useTabState } from 'reakit'

import { Box, Text } from '@island.is/island-ui/core'

import * as styles from './Tabs.css'
import { isDefined } from '@island.is/shared/utils'

type Tab = {
  label: string
  id?: string
  content: React.ReactNode
}

type Props = {
  tabs: Tab[]
  selectedTab: string
  onTabChange: (id: string) => void
  onlyRenderSelectedTab?: boolean
}

export const Tabs = ({
  tabs,
  selectedTab,
  onTabChange,
  onlyRenderSelectedTab,
}: Props) => {
  if (onlyRenderSelectedTab && !tabs.every(({ id }) => isDefined(id))) {
    throw new Error(
      'Every tab must have a unique id when onlyRenderSelectedTab is enabled',
    )
  }

  const { loop, wrap, ...tab } = useTabState({
    selectedId: selectedTab,
  })

  useEffect(() => {
    if (!tab.currentId) return
    onTabChange(tab?.currentId)
  }, [tab.currentId])

  return (
    <Box dataTestId="hello-empty" position="relative">
      <TabList {...tab} className={styles.tabsTablist}>
        {tabs.map(({ label, id }, index) => {
          const isActive = tab.currentId === id
          return (
            <Tab
              {...tab}
              key={index}
              id={`${id ?? index}`}
              className={styles.tabsTab({ active: isActive })}
            >
              <Text fontWeight={isActive ? 'medium' : 'regular'}>{label}</Text>
            </Tab>
          )
        })}
      </TabList>
      {tabs.map(({ content, id }, index) => (
        <TabPanel {...tab} key={index} className={styles.tabsTabPanel}>
          {onlyRenderSelectedTab && id ? (
            tab.selectedId === id && <Box>{content}</Box>
          ) : (
            <Box>{content}</Box>
          )}
        </TabPanel>
      ))}
    </Box>
  )
}
