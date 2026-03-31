'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ClientTabs } from '../components/ClientTabs'
import { SectionContainer } from '../components/front-page/SectionContainer'
import {
  type GetAdvertsInProgressStatsDto,
  type GetAdvertsToBePublishedStatsDto,
  type GetCountByStatusesDto,
} from '../gen/fetch'
import { SearchDashboardContainer } from './SearchDashboardContainer'

type Props = {
  initialFilters: {
    from: string
    to: string
    preset?: string | null
  }
  initialTab?: 'statistics' | 'leit'
  statusStats: GetCountByStatusesDto
  inprogressStats: GetAdvertsInProgressStatsDto
  toBePublishedStats: GetAdvertsToBePublishedStatsDto
}

export const StatisticsPageContainer = ({
  initialFilters,
  initialTab = 'statistics',
  statusStats,
  inprogressStats,
  toBePublishedStats,
}: Props) => {
  const [selectedTab, setSelectedTab] = useQueryState(
    'tab',
    parseAsStringEnum<'statistics' | 'leit'>([
      'statistics',
      'leit',
    ]).withDefault(initialTab),
  )

  const tabs = [
    {
      id: 'statistics',
      label: 'Tölfræði',
      content: (
        <SectionContainer
          inprogressStats={inprogressStats}
          statusStats={statusStats}
          toBePublishedStats={toBePublishedStats}
        />
      ),
    },
    {
      id: 'leit',
      label: 'Leit',
      content: (
        <Box background="white" padding={[3, 4]}>
          <SearchDashboardContainer
            initialFilters={initialFilters}
            title="Leit"
            description="Innri greining á leitarmynstri, niðurstöðum og svörun í Lögbirtingablaði."
          />
        </Box>
      ),
    },
  ]

  return (
    <GridContainer>
      <GridRow marginTop={[3, 4]} marginBottom={[5, 6]}>
        <GridColumn offset={['0', '1/12']} span={['12/12', '10/12']}>
          <Stack space={3}>
            <Box>
              <Text as="h1" variant="h1">
                Heildaryfirlit
              </Text>
              <Text>
                Yfirlit yfir stöðu auglýsinga og leitarmynstur í
                Lögbirtingablaði.
              </Text>
            </Box>
            <ClientTabs
              label="Heildaryfirlit"
              selected={selectedTab}
              onChange={(id) => setSelectedTab(id as 'statistics' | 'leit')}
              onlyRenderSelectedTab
              size="sm"
              tabs={tabs}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
