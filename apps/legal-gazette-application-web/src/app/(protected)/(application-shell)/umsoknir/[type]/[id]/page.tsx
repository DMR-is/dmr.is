import { HydrateClient } from '@dmr.is/trpc/client/server'
import { fetchQueryWithHandler, prefetch } from '@dmr.is/trpc/client/server'

import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function ApplicationPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  const application = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id: params.id,
    }),
  )

  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar finnst ekki')
  }

  void prefetch(trpc.getBaseEntities.queryOptions())
  const data = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id: params.id,
    }),
  )
  return (
    <HydrateClient>
      <ApplicationFormContainer application={data} />
    </HydrateClient>
  )
}
