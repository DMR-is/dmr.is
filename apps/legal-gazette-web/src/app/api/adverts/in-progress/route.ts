import { getServerSession } from 'next-auth'

import { StatusIdEnum } from '../../../../gen/fetch'
import { getLegalGazetteClient } from '../../../../lib/api/createClient'
import { authOptions } from '../../../../lib/auth/authOptions'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const query = new URL(req.url).searchParams
  const client = getLegalGazetteClient('AdvertApi', session.idToken)

  const catId = query.get('categoryId')?.split(',')
  const typeId = query.get('typeId')?.split(',')

  const data = await client.getAdvertsInProgress({
    typeId: typeId,
    categoryId: catId,
    dateFrom: query.get('dateFrom') ?? undefined,
    dateTo: query.get('dateTo') ?? undefined,
    statusId: [StatusIdEnum.SUBMITTED],
    search: query.get('search') ?? undefined,
    page: query.get('page') ? Number(query.get('page')) : 1,
    pageSize: query.get('pageSize') ? Number(query.get('pageSize')) : 10,
  })

  return Response.json(data)
}
