import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
} from '@dmr.is/trpc/client/server'

import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ApplicationStatusEnum } from '../../../../../../gen/fetch'
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
  const application = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id,
    }),
  )

  // Only the submitted view shows the price, mirroring the branch in
  // ApplicationFormContainer
  if (application?.status !== ApplicationStatusEnum.DRAFT) {
    void prefetch(
      trpc.getApplicationAdvertPrice.queryOptions({ applicationId: id }),
    )
  }

  return (
    <HydrateClient>
      <ApplicationFormContainer applicationId={id} type={mappedType} />
    </HydrateClient>
  )
}
