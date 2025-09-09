'use client'

import { useSession } from 'next-auth/react'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import useSWR from 'swr'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Tabs,
} from '@island.is/island-ui/core'

import { GetAdvertsStatusCounterDto } from '../../../gen/fetch'
import { getLegalGazetteClient } from '../../../lib/api/createClient'
import { SubmittedTab } from '../tabs/SubmittedTab'

type Props = {
  initalAdvertsCount: GetAdvertsStatusCounterDto
}

export const PageContainer = ({ initalAdvertsCount }: Props) => {
  const session = useSession()

  if (!session.data?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getLegalGazetteClient('AdvertApi', session.data.idToken)
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum(['innsendar', 'utgafa', 'yfirlit']).withDefault(
      'innsendar',
    ),
  )

  const { data: advertsCountData } = useSWR(
    'getAdvertsCount',
    (_key: string) => {
      return client.getAdvertsCount()
    },
    {
      fallbackData: initalAdvertsCount,
      keepPreviousData: true,
    },
  )

  const overviewCount =
    advertsCountData.rejected.count +
    advertsCountData.published.count +
    advertsCountData.withdrawn.count

  return (
    <Stack space={2}>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Tabs
              label=""
              selected={tab}
              /* @ts-expect-error the ids (type string) are hardcoded below */
              onChange={(tab) => setTab(tab)}
              tabs={[
                {
                  id: 'innsendar',
                  label: `Innsendar (${advertsCountData.submitted.count})`,
                  content: <SubmittedTab />,
                },
                {
                  id: 'utgafa',
                  label: `Útgáfa (${advertsCountData.readyForPublication.count})`,
                  content: <div>Útgáfa content</div>,
                },
                {
                  id: 'yfirlit',
                  label: `Yfirlit (${overviewCount})`,
                  content: <div>Yfirlit content</div>,
                },
              ]}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Stack>
  )
}
