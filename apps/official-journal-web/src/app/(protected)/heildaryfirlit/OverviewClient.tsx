'use client'

import dynamic from 'next/dynamic'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { Banner } from '../../../components/banner/Banner'
import { Meta } from '../../../components/meta/Meta'
import { Section } from '../../../components/section/Section'
import { CaseStatusEnum } from '../../../gen/fetch'
import { useFormatMessage } from '../../../hooks/useFormatMessage'
import { Routes } from '../../../lib/constants'
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
      <Banner
        title={messages.banner.title}
        description={messages.banner.description}
        imgSrc="/assets/banner-publish-image.svg"
        variant="small"
        enableCategories={true}
        enableDepartments={false}
        enableTypes={true}
        statuses={[
          CaseStatusEnum.ÚTgefið,
          CaseStatusEnum.TekiðÚrBirtingu,
          CaseStatusEnum.BirtinguHafnað,
        ]}
        contentColumnSpan={['12/12', '12/12', '5/12']}
        imageColumnSpan={['12/12', '12/12', '5/12']}
        breadcrumbs={[
          { title: messages.breadcrumbs.dashboard, href: Routes.Dashboard },
          { title: messages.breadcrumbs.casePublishing },
        ]}
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
