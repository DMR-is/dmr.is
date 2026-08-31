import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { getBaseUrl } from '../../../../lib/api/createClient'
import { authOptions } from '../../../../lib/auth/authOptions'

/**
 * Which of the two documents an approval produces to fetch.
 *
 * `urbotaaetlun` is a separate document rather than a section of the report —
 * see `improvement-plan-template.ts` — so it is a separate upstream route, and
 * this handler forwards to whichever was asked for.
 */
const DOCUMENTS = {
  skyrsla: '',
  urbotaaetlun: '/urbotaaetlun',
} as const

type DocumentKey = keyof typeof DOCUMENTS

const isDocumentKey = (value: string | null): value is DocumentKey =>
  value !== null && value in DOCUMENTS

/**
 * Streams a report PDF to the admin, so a reviewer can read exactly what the
 * company receives on approval before approving.
 *
 * The API endpoint is bearer-guarded, so a plain <a href> from the browser
 * cannot reach it — this same-origin route injects the session token
 * server-side and forwards the bytes. Mirrors `api/salary-template/route.ts`.
 *
 * `inline`, not `attachment`: the point is to look at the document, so it opens
 * in the browser's viewer rather than landing in Downloads.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reportId } = await params
  const requested = req.nextUrl.searchParams.get('doc') ?? 'skyrsla'

  if (!isDocumentKey(requested)) {
    return NextResponse.json(
      { error: `Unknown document "${requested}"` },
      { status: 400 },
    )
  }

  const res = await fetch(
    `${getBaseUrl()}/api/v1/reports/${reportId}/pdf${DOCUMENTS[requested]}`,
    { headers: { Authorization: `Bearer ${session.idToken}` } },
  )

  if (!res.ok) {
    /*
     * ⚠️ The upstream status is an ANSWER, not always a fault, so it is not
     * flattened into one message. 404 on the úrbótaáætlun means the report has no
     * outlier groups; 400 means it is an equality report. Reporting either as
     * "failed to generate" is what made a working 404 read as a broken feature.
     *
     * The sidebar now gates the button so neither should be reachable by
     * clicking — this is the direct-URL path, and it should still say something
     * true.
     */
    const message =
      res.status === 404
        ? 'Engin úrbótaáætlun fylgir þessari skýrslu.'
        : res.status === 400
          ? 'Þessi skýrsla hefur ekki úrbótaáætlun.'
          : 'Ekki var unnt að útbúa PDF fyrir þessa skýrslu.'

    return NextResponse.json({ error: message }, { status: res.status })
  }

  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${requested}-${reportId}.pdf"`,
    },
  })
}
