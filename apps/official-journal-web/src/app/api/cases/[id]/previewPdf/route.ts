import { getServerSession } from 'next-auth'

import { getServerClient } from '../../../../../lib/api/serverClient'
import { authOptions } from '../../../../../lib/auth/authOptions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.idToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const api = await getServerClient(session.idToken as string)
  const pdfBlob = await api.getCasePdfPreview({ id })

  const buffer = await pdfBlob.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="case-${id}-preview.pdf"`,
    },
  })
}
