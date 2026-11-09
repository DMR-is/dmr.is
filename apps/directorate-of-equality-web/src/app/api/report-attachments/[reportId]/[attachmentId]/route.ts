import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { getLogger } from '@dmr.is/logging-next'

import { getBaseUrl } from '../../../../../lib/api/createClient'
import { authOptions } from '../../../../../lib/auth/authOptions'

const logger = getLogger('report-attachments')

/*
 * ⚠️ **Never a `message:` key in the meta object here** — `logging-next` lets
 * it overwrite the entry's own label. Use `error:`. Same trap as the sibling
 * `equality-content` route.
 */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError'

const FETCH_FAILED_MESSAGE = 'Ekki var unnt að sækja fylgiskjalið.'
const FETCH_TIMEOUT_MESSAGE =
  'Sókn skjalsins tók of langan tíma. Prófaðu aftur.'
const NOT_FOUND_MESSAGE = 'Fylgiskjalið fannst ekki.'

/** Same reasoning as `equality-content`: a row read, nothing rendered. */
const FETCH_TIMEOUT_MS = 15_000

/**
 * ⚠️ Both ids are interpolated into the upstream URL, and Next percent-decodes
 * route params first, so an encoded traversal would otherwise turn this into an
 * authenticated proxy onto arbitrary API paths. Same guard as the sibling
 * routes.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Downloads one fylgiskjal a company sent with its equality report.
 *
 * Exists for the same reason as `equality-content`: the API is bearer-guarded,
 * so a plain link cannot reach it, and this same-origin route adds the session
 * token server-side.
 *
 * ⚠️ **Always `attachment`, never `inline`.** These are company-supplied Office
 * files and PDFs; rendering one inside the admin origin is exactly what must not
 * happen. The upstream already sends `attachment` with the uploaded name;
 * anything else is replaced rather than forwarded.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string; attachmentId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reportId, attachmentId } = await params

  if (!UUID.test(reportId) || !UUID.test(attachmentId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let res: Response

  try {
    res = await fetch(
      `${getBaseUrl()}/api/v1/reports/${reportId}/attachments/${attachmentId}`,
      {
        headers: { Authorization: `Bearer ${session.idToken}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    )
  } catch (error) {
    const timedOut = isTimeout(error)

    logger.error('Upstream report attachment fetch failed', {
      reportId,
      attachmentId,
      timedOut,
      error: errorMessage(error),
    })
    return NextResponse.json(
      { error: timedOut ? FETCH_TIMEOUT_MESSAGE : FETCH_FAILED_MESSAGE },
      { status: timedOut ? 504 : 502 },
    )
  }

  if (!res.ok) {
    if (res.status >= 500) {
      logger.error('Upstream report attachment error', {
        reportId,
        attachmentId,
        status: res.status,
      })
    }

    return NextResponse.json(
      {
        error: res.status === 404 ? NOT_FOUND_MESSAGE : FETCH_FAILED_MESSAGE,
      },
      { status: res.status },
    )
  }

  let buffer: ArrayBuffer

  try {
    buffer = await res.arrayBuffer()
  } catch (error) {
    const timedOut = isTimeout(error)

    logger.error('Reading the upstream report attachment body failed', {
      reportId,
      attachmentId,
      timedOut,
      error: errorMessage(error),
    })
    return NextResponse.json(
      { error: timedOut ? FETCH_TIMEOUT_MESSAGE : FETCH_FAILED_MESSAGE },
      { status: timedOut ? 504 : 502 },
    )
  }

  // Forward the upstream's encoded filename only when it is an `attachment`.
  const upstreamDisposition = res.headers.get('content-disposition')
  const disposition = upstreamDisposition
    ?.toLowerCase()
    .startsWith('attachment')
    ? upstreamDisposition
    : `attachment; filename="fylgiskjal-${attachmentId}"`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      // Derived upstream from the signature-checked extension.
      'Content-Type':
        res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      // Company-submitted content on a URL that does not vary by user.
      'Cache-Control': 'private, no-store',
    },
  })
}
