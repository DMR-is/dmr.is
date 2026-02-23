'use client'

import dynamic from 'next/dynamic'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { Banner } from '../../../components/banner/Banner'
import { CreateCase } from '../../../components/create-case/CreateCase'
import { Meta } from '../../../components/meta/Meta'
import { Section } from '../../../components/section/Section'
import { useFormatMessage } from '../../../hooks/useFormatMessage'
import { Routes } from '../../../lib/constants'
import { messages as caseProccessingMessages } from '../../../lib/messages/caseProcessingOverview'

const CaseOverviewTabs = dynamic(
  () => import('../../../components/tabs/CaseOverviewTabs'),
  {
    ssr: false,
    loading: () => (
      <Stack space={2}>
        <Inline space={2} justifyContent="spaceBetween">
          <SkeletonLoader width={200} height={44} borderRadius="standard" />
          <SkeletonLoader width={200} height={44} borderRadius="standard" />
          <SkeletonLoader width={200} height={44} borderRadius="standard" />
          <SkeletonLoader width={200} height={44} borderRadius="standard" />
        </Inline>
        <SkeletonLoader
          repeat={4}
          height={44}
          space={2}
          borderRadius="standard"
        />
      </Stack>
    ),
  },
)

export function CaseProcessingOverviewClient() {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Meta
        title={`${formatMessage(
          caseProccessingMessages.breadcrumbs.cases,
        )} - ${formatMessage(caseProccessingMessages.breadcrumbs.home)}`}
      />
      <Banner
        title={caseProccessingMessages.banner.title}
        description={caseProccessingMessages.banner.description}
        imgSrc="/assets/banner-small-image.svg"
        variant="small"
        enableCategories={true}
        enableDepartments={true}
        enableTypes={true}
        breadcrumbs={[
          { title: caseProccessingMessages.breadcrumbs.home, href: Routes.Dashboard },
          { title: caseProccessingMessages.breadcrumbs.cases },
        ]}
      />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Stack space={[2, 3]}>
                <CreateCase />
                <CaseOverviewTabs />
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}
