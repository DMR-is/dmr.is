'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { ApplicationForm } from '../components/form/ApplicationForm'
import { ApplicationDetailedDto, ApplicationStatusEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { ApplicationSubmittedContainer } from './ApplicationSubmittedContainer'

type Props = {
  application: ApplicationDetailedDto
}
export function ApplicationFormContainer({ application }: Props) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: application.id }),
  )

  const { data: baseEntities } = useSuspenseQuery(
    trpc.getBaseEntities.queryOptions(),
  )

  const { courtDistricts, types } = baseEntities

  if (!data) {
    return (
      <AlertMessage
        type="warning"
        title="Engin gögn fundust fyrir þessa umsókn"
        message="Vinsamlegast reyndu aftur síðar"
      />
    )
  }

  if (data.status === ApplicationStatusEnum.DRAFT) {
    return (
      <ApplicationForm
        application={data}
        types={types.map((type) => ({
          label: type.title,
          value: type.id,
        }))}
        courtDistricts={courtDistricts.map((cd) => ({
          label: cd.title,
          value: cd.id,
        }))}
      />
    )
  }

  return <ApplicationSubmittedContainer application={application} />
}
