import { getServerSession } from 'next-auth'

import { logger } from '@dmr.is/logging'

import { getServerClient } from '../../../../../lib/api/serverClient'
import { authOptions } from '../../../../../lib/auth/authOptions'

const PDF_TIMEOUT_MS = 60_000

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.idToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  try {
    const api = await getServerClient(session.idToken as string)

    const pdfBlob = await Promise.race([
      api.getCasePdfPreview({ id }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('PDF preview generation timed out')),
          PDF_TIMEOUT_MS,
        ),
      ),
    ])

    const buffer = await pdfBlob.arrayBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="case-${id}-preview.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Failed to generate PDF preview.', {
      caseId: id,
      error: error instanceof Error ? error.message : error,
    })

    const isTimeout =
      error instanceof Error && error.message.includes('timed out')

    return new Response(
      isTimeout
        ? 'PDF preview generation timed out. Please try again.'
        : 'Failed to generate PDF preview.',
      { status: isTimeout ? 504 : 500 },
    )
  }
}
