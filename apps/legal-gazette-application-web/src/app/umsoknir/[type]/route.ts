import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '../../../lib/authOptions'
import { FormTypes, PageRoutes } from '../../../lib/constants'
import { getClient } from '../../../lib/createClient'

export const dynamic = 'force-dynamic'

async function createBankruptcyApplication(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.redirect(PageRoutes.LOGIN)
  }

  const client = getClient(session.idToken)

  const newCase = await client.createCase()

  if (!newCase) {
    return NextResponse.json(
      { message: 'Failed to create case' },
      { status: 500 },
    )
  }

  await client.createBankruptcyApplication({
    caseId: newCase.id,
  })

  const { origin } = req.nextUrl

  return NextResponse.redirect(
    `${origin}/testing/${FormTypes.BANKRUPTCY}/${newCase.id}`,
    { status: 303 },
  )
}

async function handler(req: NextRequest) {
  if (req.nextUrl.searchParams.get('type') === FormTypes.BANKRUPTCY) {
    return createBankruptcyApplication(req)
  }

  return NextResponse.json(
    { message: 'Invalid application type' },
    { status: 404 },
  )
}

export { handler as GET, handler as POST }
