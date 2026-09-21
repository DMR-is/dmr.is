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

  // Started here but awaited at the end, so it runs alongside the fetches
  // below. It has to be awaited at all because the form containers read it
  // through `useQuery` and build their select options from
  // `baseEntities?.x ?? []` - streaming the page out first would server-render
  // empty selects and hydrate populated ones.
  const baseEntitiesPrefetch = prefetch({
    ...trpc.getBaseEntities.queryOptions(),
    retry: false,
  })
  const application = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id,
    }),
  )

  // Only the submitted view shows the price, mirroring the branch in
  // ApplicationFormContainer. Awaited because the submitted header renders a
  // SkeletonLoader off this query's pending flag, and its subtree already
  // server-renders - `getApplicationById` above is awaited.
  if (application?.status !== ApplicationStatusEnum.DRAFT) {
    await prefetch({
      ...trpc.getApplicationAdvertPrice.queryOptions({ applicationId: id }),
      retry: false,
    })
  }

  await baseEntitiesPrefetch

  return (
    <HydrateClient>
      <ApplicationFormContainer applicationId={id} type={mappedType} />
    </HydrateClient>
  )
}
