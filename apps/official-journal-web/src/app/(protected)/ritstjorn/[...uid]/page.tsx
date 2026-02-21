import { notFound } from 'next/navigation'

import { fetchQuery, HydrateClient } from '@dmr.is/trpc/client/server'

import { trpc } from '../../../../lib/trpc/client/server'
import { CaseDetailClient } from './CaseDetailClient'

export default async function CasePage({
  params,
}: {
  params: Promise<{ uid: string[] }>
}) {
  const { uid } = await params
  const caseId = uid?.[0]

  if (!caseId) {
    notFound()
  }

  try {
    const caseResponse = await fetchQuery(
      trpc.getCase.queryOptions({ id: caseId }),
    )

    if (!caseResponse?._case) {
      notFound()
    }

    const [types, departments, users, categories, tags, feeCodes] =
      await Promise.all([
        fetchQuery(
          trpc.getTypes.queryOptions({
            department: caseResponse._case.advertDepartment.id,
            page: 1,
            pageSize: 100,
          }),
        ),
        fetchQuery(
          trpc.getDepartments.queryOptions({}),
        ),
        fetchQuery(
          trpc.getUsers.queryOptions({
            role: 'ritstjori',
            pageSize: 1000,
            page: 1,
          }),
        ),
        fetchQuery(
          trpc.getCategories.queryOptions({
            page: 1,
            pageSize: 1000,
          }),
        ),
        fetchQuery(trpc.getTags.queryOptions()),
        fetchQuery(trpc.getFeeCodes.queryOptions()),
      ])

    return (
      <HydrateClient>
        <CaseDetailClient
          caseData={caseResponse._case}
          departments={departments?.departments ?? []}
          admins={users?.users ?? []}
          categories={categories?.categories ?? []}
          tags={tags?.tags ?? []}
          types={types?.types ?? []}
          feeCodes={feeCodes?.codes ?? []}
        />
      </HydrateClient>
    )
  } catch {
    notFound()
  }
}
