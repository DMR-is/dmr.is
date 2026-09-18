import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { getBaseUrl } from '../../../../lib/api/createClient'
import { authOptions } from '../../../../lib/auth/authOptions'

/**
 * Proxies "Keyra út lista" to the bearer-guarded export endpoint.
 *
 * Same shape and same reason as `api/salary-template/route.ts`: a plain
 * `<a href>` from the browser carries no bearer token, so this same-origin
 * route injects the session token server-side and forwards the file.
 *
 * The whole query string is passed through untouched — it IS the filter, and
 * the API owns validating it. Rewriting it here would give the export a second
 * opinion about what the admin asked for.
 */
const DATASETS = new Set(['companies', 'reports'])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params

  // Allow-listed rather than interpolated: `dataset` is a path segment and
  // lands in the upstream URL.
  if (!DATASETS.has(dataset)) {
    return NextResponse.json({ error: 'Unknown dataset' }, { status: 404 })
  }

  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = request.nextUrl.search
  const res = await fetch(`${getBaseUrl()}/api/v1/export/${dataset}${query}`, {
    headers: { Authorization: `Bearer ${session.idToken}` },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to build the export' },
      { status: res.status },
    )
  }

  const buffer = await res.arrayBuffer()

  // Content-Type and the filename come from the API — it is the side that knows
  // which format was produced and what the file is called. Rebuilding either
  // here would mean two places to keep in step with `?format=`.
  const headers = new Headers({
    'Content-Type':
      res.headers.get('content-type') ?? 'application/octet-stream',
  })

  const disposition = res.headers.get('content-disposition')
  if (disposition) headers.set('Content-Disposition', disposition)

  return new NextResponse(buffer, { status: 200, headers })
}
