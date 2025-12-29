'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Drawer } from '@dmr.is/ui/components/Drawer/Drawer'
import { Button, Inline, Stack } from '@dmr.is/ui/components/island-is'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'

import { GetAdvertsStatusCounterDto } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import { StatusIdEnum } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import CaseFilters from '../CaseFilters/CaseFilters'
import { CreateAdvert } from '../create-advert/CreateAdvert'
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

  const completedCount =
    advertCount.rejected.count +
    advertCount.published.count +
    advertCount.withdrawn.count

  return (
    <>
      <RitstjornHero />
      <GridContainer>
        <GridRow marginBottom={[4, 6]}>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Stack space={[0]}>
              <Inline space={2} justifyContent={'spaceBetween'}>
                <CaseFilters />
                <Drawer
                  disclosure={
                    <Button
                      variant="utility"
                      size="small"
                      icon="add"
                      iconType="outline"
                    >
                      Stofna auglýsingu
                    </Button>
                  }
                >
                  <CreateAdvert />
                </Drawer>
              </Inline>
              <Tabs
                label=""
                selected={tab ?? 'innsendar'}
                onChange={handleTabChange}
                onlyRenderSelectedTab={true}
                tabs={[
                  {
                    id: 'innsendar',
                    label: `Innsent / í vinnslu (${advertCount.submitted.count})`,
                    content: <SubmittedTab key="submitted-tab" />,
                  },
                  {
                    id: 'utgafa',
                    label: `Tilbúið til útgáfu (${advertCount.readyForPublication.count})`,
                    content: <PublishingTab key="publishing-tab" />,
                  },
                  {
                    id: 'yfirlit',
                    label: `Öll mál (${completedCount})`,
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
