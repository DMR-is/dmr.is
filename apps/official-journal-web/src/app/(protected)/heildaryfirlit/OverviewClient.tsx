'use client'

import dynamic from 'next/dynamic'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { Meta } from '../../../components/meta/Meta'
import { Section } from '../../../components/section/Section'
import { useFormatMessage } from '../../../hooks/useFormatMessage'
import { messages } from '../../../lib/messages/caseOverview'

const CasePublishedTabs = dynamic(
  () => import('../../../components/tabs/CasePublishedTabs'),
  {
    ssr: false,
    loading: () => (
      <SkeletonLoader
        repeat={3}
        height={44}
        space={2}
        borderRadius="standard"
      />
    ),
  },
)

export function OverviewClient() {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />
      <Section paddingTop="off">
        <GridContainer>
          <GridRow rowGap={['p2', 3]}>
            <GridColumn
              paddingTop={2}
              offset={['0', '0', '0', '1/12']}
              span={['12/12', '12/12', '12/12', '10/12']}
            >
              <CasePublishedTabs />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}
