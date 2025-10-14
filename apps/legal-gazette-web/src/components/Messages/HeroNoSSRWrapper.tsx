'use client'

import dynamic from 'next/dynamic'

import { useIntl } from 'react-intl'

import { Route, Routes } from '../../lib/constants'
import { ritstjornSingleMessages } from '../../lib/messages/ritstjorn/single'
import { routesToBreadcrumbs } from '../../lib/utils'

export const HeroNoSRR = dynamic(
  () => import('@dmr.is/ui/lazy/components/Hero/Hero'),
  {
    ssr: false,
  },
)

export const HeroNoSSRWrapper = ({ caseNumber }: { caseNumber: string }) => {
  const { formatMessage } = useIntl()
  const updatedRoutes = Routes.flatMap((route) => {
    if (route.path === Route.RITSTJORN_ID) {
      return {
        ...route,
        pathName: formatMessage(ritstjornSingleMessages.common.caseNumber, {
          caseNumber: caseNumber,
        }),
      }
    }

    return route
  })

  const breadcrumbs = routesToBreadcrumbs(
    updatedRoutes,
    Route.RITSTJORN_ID,
    formatMessage(ritstjornSingleMessages.common.caseNumber, {
      caseNumber: caseNumber,
    }),
  )

  return (
    <HeroNoSRR
      noImageFullWidth={true}
      withOffset={false}
      variant="small"
      breadcrumbs={{ items: breadcrumbs }}
      title={formatMessage(ritstjornSingleMessages.common.title)}
      description={formatMessage(ritstjornSingleMessages.common.intro)}
    />
  )
}
