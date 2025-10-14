'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'

import { GetAdvertsStatusCounterDto } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import { RitstjornHero } from '../ritstjorn/Hero'
import AdvertsCompleted from '../Tables/AdvertsCompleted'
import PublishingTab from '../tabs/PublishingTab'
import { SubmittedTab } from '../tabs/SubmittedTab'

type Props = {
  advertCount: GetAdvertsStatusCounterDto
}

const TabIds = ['innsendar', 'utgafa', 'yfirlit']

export const PageContainer = ({ advertCount }: Props) => {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum(TabIds).withDefault('innsendar'),
  )
  const { setParams } = useFilterContext()

  const handleTabChange = (tab: string) => {
    setTab(tab)
    setParams({ page: 1 })
  }

  const completedCount =
    advertCount.rejected.count +
    advertCount.published.count +
    advertCount.withdrawn.count

  return (
    <>
      <RitstjornHero />
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Tabs
              label=""
              selected={tab}
              onChange={handleTabChange}
              tabs={[
                {
                  id: 'innsendar',
                  label: `Innsendar (${advertCount.submitted.count})`,
                  content: <SubmittedTab key="submitted-tab" />,
                },
                {
                  id: 'utgafa',
                  label: `Útgáfa (${advertCount.readyForPublication.count})`,
                  content: <PublishingTab key="publishing-tab" />,
                },
                {
                  id: 'yfirlit',
                  label: `Yfirlit (${completedCount})`,
                  content: <AdvertsCompleted key="overview-tab" />,
                },
              ]}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
