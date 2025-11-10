'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'

import { GetAdvertsStatusCounterDto, StatusIdEnum } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import {  useTRPC } from '../../lib/trpc/client/trpc'
import { RitstjornHero } from '../ritstjorn/Hero'
import AdvertsCompleted from '../Tables/AdvertsCompleted'
import PublishingTab from '../tabs/PublishingTab'
import { SubmittedTab } from '../tabs/SubmittedTab'

type Props = {
  advertCount: GetAdvertsStatusCounterDto
}

const TabIds = ['innsendar', 'utgafa', 'yfirlit']

export const PageContainer = ({ advertCount }: Props) => {
  const [tab, setTab] = useQueryState('tab', parseAsStringEnum(TabIds))
  const { setParams, setStatusOptions, resetStatusOptions } = useFilterContext()

  const trpc = useTRPC()
  const { data, isPending } = useSuspenseQuery(trpc.getStatuses.queryOptions())

  const handleTabChange = (tab: string) => {
    resetStatusOptions()
    setTab(tab)
    setParams({ page: 1 })
  }

  useEffect(() => {
    if (isPending) return
    switch (tab) {
      case 'innsendar':
        setStatusOptions(
          data.statuses
            .filter((status) =>
              [StatusIdEnum.SUBMITTED, StatusIdEnum.IN_PROGRESS].includes(
                status.id as StatusIdEnum,
              ),
            )
            .map((opt) => ({
              label: opt.title,
              value: opt.id,
            })),
        )
        break
      case 'utgafa':
        setStatusOptions(
          data.statuses
            .filter((status) =>
              [StatusIdEnum.READY_FOR_PUBLICATION].includes(
                status.id as StatusIdEnum,
              ),
            )
            .map((opt) => ({
              label: opt.title,
              value: opt.id,
            })),
        )
        break
      default:
        break
    }
  }, [tab, isPending, setStatusOptions, data])

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
              selected={tab ?? 'innsendar'}
              onChange={handleTabChange}
              onlyRenderSelectedTab={true}
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
