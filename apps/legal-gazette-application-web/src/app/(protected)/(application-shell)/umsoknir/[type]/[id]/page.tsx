import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
} from '@dmr.is/trpc/client/server'

import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { trpc } from '../../../../../../lib/trpc/client/server'
import { mapFormTypeToApplicationType } from '../../../../../../lib/utils'

export default async function ApplicationPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar er ekki til')
  }

  const mappedType = mapFormTypeToApplicationType(params.type)

  void prefetch(trpc.getBaseEntities.queryOptions())
  const data = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id: params.id,
    }),
  )

  return (
    <HydrateClient>
      <ApplicationFormContainer application={data} type={mappedType} />
    </HydrateClient>
  )
}
