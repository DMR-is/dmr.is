import { isDefined } from 'class-validator'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

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

  return (
    <GridContainer position="relative">
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '12/12', '9/12']}>
          <Box hidden={hideTablist}>
            <div
              role="tablist"
              className={styles.tabsTablist}
              aria-label={label}
            >
              {tabs.map(({ label, id }, index) => {
                const tabId = id ?? `${index}`
                const isActive = selectedTab === tabId
                return (
                  <button
                    key={tabId}
                    role="tab"
                    id={`tab-${tabId}`}
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tabId}`}
                    className={styles.tabsTab({ active: isActive })}
                    onClick={() => onTabChange(tabId)}
                    type="button"
                  >
                    <Text fontWeight={isActive ? 'medium' : 'regular'}>
                      {label}
                    </Text>
                  </button>
                )
              })}
            </div>
          </Box>
        </GridColumn>
      </GridRow>
      <GridColumn>
        {tabs.map(({ content, id }, index) => {
          const tabId = id ?? `${index}`
          const isActive = selectedTab === tabId
          return (
            <div
              key={index}
              role="tabpanel"
              id={`tabpanel-${tabId}`}
              aria-labelledby={`tab-${tabId}`}
              hidden={!isActive}
              className={styles.tabsTabPanel}
            >
              {onlyRenderSelectedTab && id ? (
                isActive && <Box>{content}</Box>
              ) : (
                <Box>{content}</Box>
              )}
            </div>
          )
        })}
      </GridColumn>
    </GridContainer>
  )
}
