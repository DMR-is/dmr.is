'use client'

import dynamic from 'next/dynamic'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { Banner } from '../../../components/banner/Banner'
import { Section } from '../../../components/section/Section'
import { messages } from '../../../lib/messages/casePublishOverview'

const AdvertReplacementTabs = dynamic(
  () => import('../../../components/tabs/AdvertReplacementTabs'),
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

export default function AdvertPdfReplacementPage() {
  return (
    <>
      <Banner
        title={messages.banner.title}
        description={messages.banner.description}
        variant="small"
        imgSrc="/assets/banner-publish-image.svg"
        contentColumnSpan={['12/12', '12/12', '7/12']}
        imageColumnSpan={['12/12', '12/12', '3/12']}
        enableSearch={true}
      />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <AdvertReplacementTabs />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}
