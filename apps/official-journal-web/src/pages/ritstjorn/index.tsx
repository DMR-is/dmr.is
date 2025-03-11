import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth/next'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  SkeletonLoader,
  Stack,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { Routes } from '../../lib/constants'
import { messages as caseProccessingMessages } from '../../lib/messages/caseProcessingOverview'
import {
  deleteUndefined,
  loginRedirect,
  mapTabIdToCaseStatus,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'
import { authOptions } from '../api/auth/[...nextauth]'

const CaseOverviewTabs = dynamic(
  () => import('../../components/tabs/CaseOverviewTabs'),
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

export default function CaseProccessingOverviewScreen() {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Meta
        title={`${formatMessage(
          caseProccessingMessages.breadcrumbs.cases,
        )} - ${formatMessage(caseProccessingMessages.breadcrumbs.home)}`}
      />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <CaseOverviewTabs />
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
  query,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const currentStatus = query?.status
  const status = mapTabIdToCaseStatus(currentStatus as string)

  if (!currentStatus) {
    return {
      redirect: {
        destination: `${Routes.ProcessingOverview}?status=${status}`,
        permanent: false,
      },
    }
  }

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-small-image.svg',
      title: caseProccessingMessages.banner.title,
      description: caseProccessingMessages.banner.description,
      variant: 'small',
      enableCategories: true,
      enableDepartments: true,
      enableTypes: true,
      breadcrumbs: [
        {
          title: caseProccessingMessages.breadcrumbs.home,
          href: Routes.Dashboard,
        },
        {
          title: caseProccessingMessages.breadcrumbs.cases,
        },
      ],
    },
  }

  try {
    return {
      props: deleteUndefined({
        session,
        layout,
      }),
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir ritstjórn.',
      (error as Error)?.message,
    )
  }
}
