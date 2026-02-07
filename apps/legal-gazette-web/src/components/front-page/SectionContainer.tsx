'use client'

import dynamic from 'next/dynamic'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Section } from '@dmr.is/ui/components/Section/Section'
import { TrackerTable } from '@dmr.is/ui/components/Tables/TrackerTable'
import { Wrapper } from '@dmr.is/ui/components/Wrapper/Wrapper'

import {
  GetAdvertsInProgressStatsDto,
  GetAdvertsToBePublishedStatsDto,
  GetCountByStatusesDto,
} from '../../gen/fetch'
import { Route } from '../../lib/constants'

const PieChart = dynamic(
  () =>
    import('@dmr.is/ui/lazy/components/PieChart/PieChart').then(
      (mod) => mod.PieChart,
    ),
  {
    ssr: false,
  },
)

type Props = {
  statusStats: GetCountByStatusesDto
  inprogressStats: GetAdvertsInProgressStatsDto
  toBePublishedStats: GetAdvertsToBePublishedStatsDto
}

export const SectionContainer = ({
  statusStats,
  inprogressStats,
  toBePublishedStats,
}: Props) => {
  const totalCount = Object.values(statusStats).reduce(
    (acc, curr) => acc + curr,
    0,
  )

  const replacedZero = (value: number) => (value === 0 ? 'Engar' : value)

  const calculatePercentage = (count: number, total: number) =>
    total === 0 ? 0 : Math.round((count / total) * 100)

  return (
    <Section bleed variant="blue">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              <Wrapper
                title="Ritstjórn"
                link={Route.RITSTJORN}
                linkText="Opna ritstjórn"
              >
                <TrackerTable
                  rows={[
                    {
                      text: `${replacedZero(inprogressStats.submittedTodayCount)} innsendar auglýsingar í dag`,
                    },
                    {
                      text: `${replacedZero(inprogressStats.totalInProgressCount)} auglýsingar skráðar í vinnslu`,
                    },
                    {
                      text: `${replacedZero(inprogressStats.withCommentsCount)} auglýsingar með skráðar athugasemdir`,
                    },
                    {
                      text: `${replacedZero(inprogressStats.unassignedCount)} auglýsingar með engan skráðan starfsmann`,
                    },
                  ]}
                />
              </Wrapper>
              <Wrapper
                title="Útgáfa"
                link={Route.UTGAFA}
                linkText="Opna útgáfuferli"
              >
                <TrackerTable
                  rows={[
                    {
                      text: `${replacedZero(toBePublishedStats.tobePublishedTodayCount)} auglýsingar tilbúnar til útgáfu með útgáfugáfu í dag.`,
                    },
                    {
                      text: `${replacedZero(toBePublishedStats.tobePublishedTodayCount)} auglýsingar eru með liðinn birtingardag.`,
                    },
                  ]}
                />
              </Wrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '5/12']}>
            <Wrapper title="Tölfræði">
              <PieChart
                intro="Staða óútgefinna mála."
                items={[
                  {
                    color: 'purple400',
                    title: 'Innsent',
                    count: statusStats.submittedCount,
                    percentage: calculatePercentage(
                      statusStats.submittedCount,
                      totalCount,
                    ),
                  },
                  {
                    color: 'blue400',
                    title: 'Í vinnslu',
                    count: statusStats.inprogressCount,
                    percentage: calculatePercentage(
                      statusStats.inprogressCount,
                      totalCount,
                    ),
                  },
                  {
                    color: 'mint400',
                    title: 'Tilbúið til útgáfu',
                    count: statusStats.tobePublishedCount,
                    percentage: calculatePercentage(
                      statusStats.tobePublishedCount,
                      totalCount,
                    ),
                  },
                ]}
              />
            </Wrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
