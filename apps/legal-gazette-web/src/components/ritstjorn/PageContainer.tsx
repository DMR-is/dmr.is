'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Inline, Stack } from '@dmr.is/ui/components/island-is'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilters'
import { StatusIdEnum } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import CaseFilters from '../CaseFilters/CaseFilters'
import { CretaeAdvertMenu } from '../create-advert/CreateAdvertMenu'
import { RitstjornHero } from '../ritstjorn/Hero'
import AdvertsCompleted from '../Tables/AdvertsCompleted'
import { PublicationsToBePublishedTab } from '../tabs/PublicationsTab'
import PublishingTab from '../tabs/PublishingTab'
import { SubmittedTab } from '../tabs/SubmittedTab'

const TabIds = [
  'innsendar',
  'utgafa-auglysinga',
  'utgafa-i-birtinga',
  'yfirlit',
]

export const PageContainer = () => {
  const [tab, setTab] = useQueryState('tab', parseAsStringEnum(TabIds))
  const { setParams, setStatusOptions, resetStatusOptions, params } =
    useFilterContext()

  const trpc = useTRPC()
  const { data, isPending } = useSuspenseQuery(trpc.getStatuses.queryOptions())

  const { data: countData } = useSuspenseQuery(
    trpc.getAdvertsCount.queryOptions({
      categoryId: params.categoryId,
      typeId: params.typeId,
      search: params.search,
      statusId: params.statusId,
    }),
  )

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
          data.statuses.flatMap((status) => {
            if (
              StatusIdEnum.SUBMITTED === status.id ||
              StatusIdEnum.IN_PROGRESS === status.id
            ) {
              return {
                label: status.title,
                value: status.id,
              }
            }
            return []
          }),
        )
        break
      case 'utgafa':
        setStatusOptions(
          data.statuses.flatMap((status) => {
            if (StatusIdEnum.READY_FOR_PUBLICATION === status.id) {
              return {
                label: status.title,
                value: status.id,
              }
            }
            return []
          }),
        )
        break
      default:
        break
    }
  }, [tab, isPending, setStatusOptions, data])

  const submittedCount = countData ? countData.submittedTab.count : '...'

  const readyForPublicationCount = countData
    ? countData.readyForPublicationTab.count
    : '...'

  const inPublishingCount = countData ? countData.inPublishingTab.count : '...'

  const finishedCount = countData ? countData.finishedTab.count : '...'

  return (
    <>
      <RitstjornHero />
      <GridContainer>
        <GridRow marginBottom={[4, 6]}>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Stack space={[0]}>
              <Inline space={2} justifyContent={'spaceBetween'}>
                <CaseFilters />
                <CretaeAdvertMenu />
              </Inline>
              <Tabs
                label=""
                selected={tab ?? 'innsendar'}
                onChange={handleTabChange}
                onlyRenderSelectedTab={true}
                tabs={[
                  {
                    id: 'innsendar',
                    label: `Innsent / í vinnslu (${submittedCount})`,
                    content: <SubmittedTab key="submitted-tab" />,
                  },
                  {
                    id: 'utgafa-auglysinga',
                    label: `Tilbúið til útgáfu (${readyForPublicationCount})`,
                    content: <PublishingTab key="publishing-tab" />,
                  },
                  {
                    id: 'utgafa-i-birtinga',
                    label: `Í útgáfu (${inPublishingCount})`,
                    content: <PublicationsToBePublishedTab />,
                  },
                  {
                    id: 'yfirlit',
                    label: `Allar auglýsingar (${finishedCount})`,
                    content: <AdvertsCompleted key="overview-tab" />,
                  },
                ]}
              />
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
