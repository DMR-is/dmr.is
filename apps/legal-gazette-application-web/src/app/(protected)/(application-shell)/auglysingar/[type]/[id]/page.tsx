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
  params: Promise<{ id: string; type: FormTypes }>
}) {
  const { id, type } = await params
  if (!ALLOWED_FORM_TYPES.includes(type)) {
    throw new Error('Tegund auglýsingar er ekki til')
  }

  const mappedType = mapFormTypeToApplicationType(type)

  void prefetch(trpc.getBaseEntities.queryOptions())
  await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id,
    }),
  )

  return (
    <HydrateClient>
      <ApplicationFormContainer applicationId={id} type={mappedType} />
    </HydrateClient>
  )
}
