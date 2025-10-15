'use client'

import { notFound } from 'next/navigation'

import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { ApplicationSubmitted } from '../components/client-components/application/ApplicationSubmitted'
import { ApplicationForm } from '../components/client-components/form/ApplicationForm'
import {
  ApplicationDetailedDto,
  ApplicationDetailedDtoStatusEnum,
} from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type Props = {
  application: ApplicationDetailedDto
}
export function ApplicationFormContainer({ application }: Props) {
  const { data, error, isLoading } =
    trpc.applicationApi.getApplicationById.useQuery(
      { id: application.id },
      { initialData: application },
    )

  if (error) {
    return notFound()
  }

  if (isLoading) {
    return <SkeletonLoader height={450} borderRadius="large" />
  }

  if (!data) {
    return (
      <AlertMessage
        type="warning"
        title="Engin gögn fundust fyrir þessa umsókn"
        message="Vinsamlegast reyndu aftur síðar"
      />
    )
  }

  if (data.status === ApplicationDetailedDtoStatusEnum.DRAFT) {
    const [{ courtDistricts, types }] =
      trpc.applicationApi.getBaseEntities.useSuspenseQuery()
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

  // return <ApplicationSubmitted adverts={[]} />
  return <div>Birta auglysingar</div>
}
