import { Box, Text } from '@island.is/island-ui/core'
import { Tab, TabList, TabPanel, useTabState } from 'reakit'
import * as styles from './Tabs.css'
import { useEffect } from 'react'

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
    <Box>
      <Box className={styles.tabsTablist}>
        <TabList {...tabs}>
          {tabs.map(({ label, id }) => {
            const isActive = id === selectedTab
            return (
              <Tab
                {...tab}
                id={id}
                className={styles.tabsTab({ active: isActive })}
                key={id}
              >
                <Text
                  color={isActive ? 'blue400' : 'currentColor'}
                  fontWeight={isActive ? 'semiBold' : 'regular'}
                >
                  {label}
                </Text>
              </Tab>
            )
          })}
        </TabList>
      </Box>
      <Box>
        {tabs.map(({ id, content }) => (
          <TabPanel {...tab} key={id} id={id} className={styles.tabsTabPanel}>
            {content}
          </TabPanel>
        ))}
      </Box>
    </Box>
  )
}
