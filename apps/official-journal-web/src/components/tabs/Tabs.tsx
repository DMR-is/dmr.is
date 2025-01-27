import { useEffect } from 'react'
import { Tab, TabList, TabPanel, useTabState } from 'reakit'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'
import { isDefined } from '@island.is/shared/utils'

import * as styles from './Tabs.css'

export type Tab<T = string> = {
  label: string
  id?: T
  content: React.ReactNode
}

type Props = {
  tabs: Tab[]
  selectedTab: string
  onTabChange: (id: string) => void
  onlyRenderSelectedTab?: boolean
  hideTablist?: boolean
  label: string
}

export const Tabs = ({
  tabs,
  selectedTab,
  onTabChange,
  onlyRenderSelectedTab,
  hideTablist = false,
  label,
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
    <GridContainer position="relative">
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '12/12', '9/12']}>
          <Box hidden={hideTablist}>
            <TabList {...tab} className={styles.tabsTablist} aria-label={label}>
              {tabs.map(({ label, id }, index) => {
                const isActive = tab.currentId === id
                return (
                  <Tab
                    {...tab}
                    key={id ?? index}
                    id={`${id ?? index}`}
                    className={styles.tabsTab({ active: isActive })}
                  >
                    <Text fontWeight={isActive ? 'medium' : 'regular'}>
                      {label}
                    </Text>
                  </Tab>
                )
              })}
            </TabList>
          </Box>
        </GridColumn>
      </GridRow>
      <GridColumn>
        {tabs.map(({ content, id }, index) => (
          <TabPanel {...tab} key={index} className={styles.tabsTabPanel}>
            {onlyRenderSelectedTab && id ? (
              tab.selectedId === id && <Box>{content}</Box>
            ) : (
              <Box>{content}</Box>
            )}
          </TabPanel>
        ))}
      </GridColumn>
    </GridContainer>
  )
}
