import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getSession } from 'next-auth/react'

import {
  AlertMessage,
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
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'

const ReadyForPublicationTabs = dynamic(
  () => import('../../components/tabs/CaseReadyForPublicationTabs'),
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

const NotificationPortal = dynamic(
  () => import('../../components/notification-portal/NotificationPortal'),
  {
    ssr: false,
  },
)

type Props = {
  success: boolean
}

export default function CasePublishingOverview({ success }: Props) {
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
              <ReadyForPublicationTabs />
              {success && (
                <NotificationPortal>
                  <AlertMessage
                    type="success"
                    title="Útgáfa mála heppnaðist"
                    message="Málin eru nú orðin sýnileg á ytri vef."
                  />
                </NotificationPortal>
              )}
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

  try {
    const didSuccessfullyPublishCases = query.success === 'true'

    return {
      props: deleteUndefined({
        session,
        layout,
        success: didSuccessfullyPublishCases,
      }),
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir útgáfu.',
      (error as Error)?.message,
    )
  }
}
