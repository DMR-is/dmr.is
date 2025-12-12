import { NextResponse } from 'next/server'

import { getServerClient } from '../../../../../lib/api/serverClient'

import { TRPCError } from '@trpc/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const client = await getServerClient()
    // get id from param and version from query
    const { searchParams } = new URL(request.url)
    const id = params.id
    const version = searchParams.get('version')

    const pdfBuffer = await client.getAdvertPdf({
      id,
      version: version ?? undefined,
    })

    return new NextResponse(pdfBuffer.stream(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${id}.pdf"`,
      },
    })
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return new NextResponse('Error fetching PDF', { status: 500 })
  }
}
