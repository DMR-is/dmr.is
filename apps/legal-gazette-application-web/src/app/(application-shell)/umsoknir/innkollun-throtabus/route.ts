import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { PageRoutes } from '../../../../lib/constants'
import { getClient } from '../../../../lib/createClient'
import { authOptions } from '../../../api/auth/[...nextauth]/route'

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.redirect(PageRoutes.LOGIN)
  }

  const client = getClient('LgApplicationWeb')

  const newCase = await client.createCase()

  if (!newCase) {
    return NextResponse.json(
      { message: 'Failed to create case' },
      { status: 500 },
    )
  }

  const { origin } = req.nextUrl

  return NextResponse.redirect(
    `${origin}/${PageRoutes.APPLICATION_THROTABU}/${newCase.id}`,
    { status: 303 },
  )
}

export { handler as GET, handler as POST }
