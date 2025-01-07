import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { Suspense } from 'react'

import {
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { CaseOverviewTabs } from '../../components/tabs/CaseOverviewTabs'
import { GetCasesOverview } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { messages as caseProccessingMessages } from '../../lib/messages/caseProcessingOverview'
import {
  deleteUndefined,
  loginRedirect,
  mapTabIdToCaseStatus,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  data: GetCasesOverview
}

export default function CaseProccessingOverviewScreen({ data }: Props) {
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
              <Suspense
                fallback={
                  <SkeletonLoader
                    repeat={5}
                    space={2}
                    borderRadius="standard"
                    height={44}
                  />
                }
              >
                <CaseOverviewTabs data={data} />
              </Suspense>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

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

  const client = createDmrClient()

  const caseOverview = await client.editorialOverview({
    status: status,
  })

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
        data: caseOverview,
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
