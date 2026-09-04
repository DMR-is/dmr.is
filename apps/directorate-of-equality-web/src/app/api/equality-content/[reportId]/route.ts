import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { getLogger } from '@dmr.is/logging-next'

import { getBaseUrl } from '../../../../lib/api/createClient'
import { authOptions } from '../../../../lib/auth/authOptions'

const logger = getLogger('equality-content')

/*
 * ⚠️ **Never a `message:` key in the meta object here.** `logging-next` builds
 * its entry as `{ level, message, timestamp, ...meta }`, so a `message` field in
 * the meta OVERWRITES the entry's own label. Use `error:`. Same trap as
 * `api/report-pdf/[reportId]/route.ts`.
 */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError'

const FETCH_FAILED_MESSAGE = 'Ekki var unnt að sækja jafnréttisáætlunina.'
const FETCH_TIMEOUT_MESSAGE = 'Sókn skjalsins tók of langan tíma. Prófaðu aftur.'
const NOT_FOUND_MESSAGE =
  'Engin jafnréttisáætlun á PDF-formi fylgir þessari skýrslu.'

/**
 * Shorter than the 60s the generated-PDF route allows, and deliberately so:
 * nothing is rendered here. The upstream reads a row and decodes base64, so a
 * request still running after fifteen seconds is a stuck connection rather than
 * a slow document.
 */
const FETCH_TIMEOUT_MS = 15_000

/**
 * ⚠️ `reportId` is interpolated into the upstream URL and Next percent-decodes
 * route params before they reach here, so an encoded traversal arrives already
 * decoded and the WHATWG URL parser collapses it — turning this into an
 * authenticated GET proxy onto arbitrary paths of a server-only API carrying the
 * caller's own token. The upstream `ParseUUIDPipe` only protects the path we
 * meant to call. Same guard, same reason, as the report-pdf route.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Streams the jafnréttisáætlun PDF a company uploaded, so a reviewer can read
 * the plan they are assessing.
 *
 * Exists because the report detail deliberately does NOT carry these bytes —
 * they are megabytes of base64 and would ride along on every read — and because
 * the API endpoint is bearer-guarded, so the iframe in `EqualityReportTab`
 * cannot reach it directly. This same-origin route injects the session token
 * server-side and forwards the bytes.
 *
 * `inline`: the document is embedded in an iframe and read on the page, not
 * downloaded.
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

  let res: Response

  try {
    res = await fetch(
      `${getBaseUrl()}/api/v1/reports/${reportId}/equality-content/pdf`,
      {
        headers: { Authorization: `Bearer ${session.idToken}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    )
  } catch (error) {
    const timedOut = isTimeout(error)

    logger.error('Upstream equality content PDF fetch failed', {
      reportId,
      timedOut,
      error: errorMessage(error),
    })
    return NextResponse.json(
      { error: timedOut ? FETCH_TIMEOUT_MESSAGE : FETCH_FAILED_MESSAGE },
      { status: timedOut ? 504 : 502 },
    )
  }

  if (!res.ok) {
    /*
     * A 404 is an ANSWER, not a fault: the report's content is rich text rather
     * than an uploaded file, so there is no PDF to serve. The tab only renders
     * the iframe when `contentType` is PDF, so this is the direct-URL path — and
     * it should still say something true rather than "failed to fetch".
     */
    if (res.status >= 500) {
      logger.error('Upstream equality content PDF error', {
        reportId,
        status: res.status,
      })
    }

    return NextResponse.json(
      {
        error:
          res.status === 404 ? NOT_FOUND_MESSAGE : FETCH_FAILED_MESSAGE,
      },
      { status: res.status },
    )
  }

  let buffer: ArrayBuffer

  try {
    buffer = await res.arrayBuffer()
  } catch (error) {
    // The same `AbortSignal` covers the body stream, so a request that got its
    // headers out can still time out here.
    const timedOut = isTimeout(error)

    logger.error('Reading the upstream equality content PDF body failed', {
      reportId,
      timedOut,
      error: errorMessage(error),
    })
    return NextResponse.json(
      { error: timedOut ? FETCH_TIMEOUT_MESSAGE : FETCH_FAILED_MESSAGE },
      { status: timedOut ? 504 : 502 },
    )
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="jafnrettisaaetlun-${reportId}.pdf"`,
      // Company-submitted content on a URL that does not vary by user.
      'Cache-Control': 'private, no-store',
    },
  })
}
