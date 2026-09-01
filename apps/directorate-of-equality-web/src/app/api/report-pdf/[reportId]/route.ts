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
 * ⚠️ `reportId` is interpolated into the upstream URL, and Next percent-decodes
 * route params before they reach here — so `..%2Fcompanies%3Fq%3Dx` arrives
 * already decoded and the WHATWG URL parser collapses the traversal, turning
 * this into an authenticated GET proxy onto arbitrary paths of a server-only API
 * carrying the caller's own token. Per-endpoint guards still apply and the origin
 * is fixed, so this is lateral reach rather than a bypass — but the upstream
 * `ParseUUIDPipe` only protects the path we intended to call, and a check here
 * costs nothing.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  if (!UUID.test(reportId)) {
    return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
  }

  const requested = req.nextUrl.searchParams.get('doc') ?? 'skyrsla'

  if (!isDocumentKey(requested)) {
    // Does not echo `requested`: it is unbounded attacker-controlled text and
    // naming it back buys nothing. The valid set is fixed and documented.
    return NextResponse.json({ error: 'Unknown document' }, { status: 400 })
  }

  /*
   * ⚠️ Guarded, and logged. Both `fetch` and `arrayBuffer` were bare, so a
   * Chromium render failure upstream or an API outage produced an unhandled
   * rejection and a bare 500 with nothing on the web side to explain it — while
   * the whole point of these buttons is to diagnose the documents.
   */
  let res: Response

  try {
    res = await fetch(
      `${getBaseUrl()}/api/v1/reports/${reportId}/pdf${DOCUMENTS[requested]}`,
      { headers: { Authorization: `Bearer ${session.idToken}` } },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[report-pdf] upstream fetch failed', {
      reportId,
      requested,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Ekki var unnt að útbúa PDF fyrir þessa skýrslu.' },
      { status: 502 },
    )
  }

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
    // ⚠️ Keyed on `requested` as well as the status. These messages used to
    // ignore it, so a failed *skýrsla* request reported a missing úrbótaáætlun —
    // and a rejected id claimed the same for either document. The goal stated in
    // this handler's own comment is to say something true; that needs both.
    const isPlan = requested === 'urbotaaetlun'
    const message =
      isPlan && res.status === 404
        ? 'Engin úrbótaáætlun fylgir þessari skýrslu.'
        : isPlan && res.status === 400
          ? 'Þessi skýrsla hefur ekki úrbótaáætlun.'
          : res.status === 404
            ? 'Skýrslan fannst ekki.'
            : 'Ekki var unnt að útbúa PDF fyrir þessa skýrslu.'

    // A 404/400 is an answer about the document, not a fault. Anything else is,
    // and leaves no trace upstream that the reviewer can see.
    if (res.status >= 500) {
      // eslint-disable-next-line no-console
      console.error('[report-pdf] upstream error', {
        reportId,
        requested,
        status: res.status,
      })
    }

    return NextResponse.json({ error: message }, { status: res.status })
  }

  let buffer: ArrayBuffer

  try {
    buffer = await res.arrayBuffer()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[report-pdf] reading the upstream body failed', {
      reportId,
      requested,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Ekki var unnt að útbúa PDF fyrir þessa skýrslu.' },
      { status: 502 },
    )
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${requested}-${reportId}.pdf"`,
      // Employee salary data on a URL that does not vary by user.
      'Cache-Control': 'private, no-store',
    },
  })
}
