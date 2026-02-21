'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import { Suspense } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { Meta } from '../../../components/meta/Meta'
import { Section } from '../../../components/section/Section'
import { useFormatMessage } from '../../../hooks/useFormatMessage'
import { messages } from '../../../lib/messages/casePublishOverview'

const ReadyForPublicationTabs = dynamic(
  () => import('../../../components/tabs/CaseReadyForPublicationTabs'),
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
  () => import('../../../components/notification-portal/NotificationPortal'),
  {
    ssr: false,
  },
)

function PublishingOverviewContent() {
  const { formatMessage } = useFormatMessage()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'

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

export default function PublishingOverviewPage() {
  return (
    <Suspense>
      <PublishingOverviewContent />
    </Suspense>
  )
}
