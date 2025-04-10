import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'

import {
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/casePublishOverview'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const AdvertReplacementTabs = dynamic(
  () => import('../../components/tabs/AdvertReplacementTabs'),
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

export default function AdvertPdfReplacement() {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: messages.banner.title,
      description: messages.banner.description,
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '7/12'],
      imageColumnSpan: ['12/12', '12/12', '3/12'],
      enableCategories: true,
      enableDepartments: false,
      enableTypes: true,
      breadcrumbs: [
        {
          title: messages.breadcrumbs.dashboard,
          href: Routes.Dashboard,
        },
        {
          title: messages.breadcrumbs.casePublishing,
        },
      ],
    },
  }
  return { props: { layout } }
}
