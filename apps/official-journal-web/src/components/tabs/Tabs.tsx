import { Box, FocusableBox, Text } from '@island.is/island-ui/core'
import { Tab, TabList, TabPanel, useTabState } from 'reakit'
import * as styles from './Tabs.css'
import { useEffect, useState } from 'react'

type Tab = {
  label: string
  id?: string
  content: React.ReactNode
}

type Props = {
  tabs: Tab[]
  selectedTab: string
  onTabChange: (id: string) => void
}

export const Tabs = ({ tabs, selectedTab, onTabChange }: Props) => {
  const { loop, wrap, ...tab } = useTabState({
    selectedId: selectedTab,
  })

  useEffect(() => {
    if (!tab.currentId) return
    onTabChange(tab?.currentId)
  }, [tab.currentId])

  return (
    <Box position="relative">
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
      {tabs.map(({ content }, index) => (
        <TabPanel {...tab} key={index} className={styles.tabsTabPanel}>
          <Box>{content}</Box>
        </TabPanel>
      ))}
    </Box>
  )
}
