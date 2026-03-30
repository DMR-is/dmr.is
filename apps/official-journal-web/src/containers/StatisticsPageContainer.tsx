'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Tabs, type TabType } from '@dmr.is/ui/components/island-is/Tabs'

import { Banner } from '../components/banner/Banner'
import { Meta } from '../components/meta/Meta'
import { Section } from '../components/section/Section'
import { StatisticsContainer } from '../components/statistics/StatisticsContainer'
import { Routes } from '../lib/constants'
import { SearchDashboardContainer } from './SearchDashboardContainer'

type Props = {
  initialFilters: {
    from: string
    to: string
    preset?: string | null
  }
  initialTab?: 'statistics' | 'leit'
}

export const StatisticsPageContainer = ({
  initialFilters,
  initialTab = 'statistics',
}: Props) => {
  const [selectedTab, setSelectedTab] = useQueryState(
    'tab',
    parseAsStringEnum<'statistics' | 'leit'>([
      'statistics',
      'leit',
    ]).withDefault(initialTab),
  )

  const tabs: TabType[] = [
    {
      id: 'statistics',
      label: 'Tölfræði',
      content: (
        <Box background="white" padding={[3, 4]}>
          <StatisticsContainer embedded />
        </Box>
      ),
    },
    {
      id: 'leit',
      label: 'Leit',
      content: (
        <Box background="white" padding={[3, 4]}>
          <SearchDashboardContainer
            embedded
            initialFilters={initialFilters}
            title="Leit"
            description="Innri greining á leitarmynstri, niðurstöðum og svörun í Stjórnartíðindum."
          />
        </Box>
      ),
    },
  ]

  return (
    <>
      <Meta title="Tölfræði - Stjórnartíðindi" />
      <Banner
        title="Tölfræði"
        description="Yfirlit yfir stöðu mála og leitarmynstur í Stjórnartíðindum."
        variant="small"
        imgSrc="/assets/banner-small-image.svg"
        breadcrumbs={[
          { title: 'Stjórnartíðindi', href: Routes.Dashboard },
          { title: 'Tölfræði' },
        ]}
      />
      <Section>
        <GridContainer>
          <GridRow>
            <GridColumn
              offset={['0', '1/12']}
              span={['12/12', '10/12']}
              paddingBottom={[2, 2, 3]}
            >
              <Tabs
                label="Tölfræðisvæði"
                selected={selectedTab}
                onChange={(id) => setSelectedTab(id as 'statistics' | 'leit')}
                onlyRenderSelectedTab
                size="sm"
                tabs={tabs}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}
