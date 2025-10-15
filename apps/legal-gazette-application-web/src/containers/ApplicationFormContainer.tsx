'use client'

import { ApplicationSubmitted } from '../components/client-components/application/ApplicationSubmitted'
import { ApplicationForm } from '../components/client-components/form/ApplicationForm'
import { ApplicationDetailedDtoStatusEnum } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type Props = {
  id: string
}
export function ApplicationFormContainer({ id }: Props) {
  const [application] = trpc.applicationApi.getApplicationById.useSuspenseQuery(
    { id },
  )

  if (application.status === ApplicationDetailedDtoStatusEnum.DRAFT) {
    const [{ courtDistricts, types }] =
      trpc.applicationApi.getBaseEntities.useSuspenseQuery()
    return (
      <ApplicationForm
        application={application}
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

  return <ApplicationSubmitted adverts={[]} />
}
