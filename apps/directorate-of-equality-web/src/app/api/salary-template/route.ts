import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { getBaseUrl } from '../../../lib/api/createClient'
import { authOptions } from '../../../lib/auth/authOptions'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Streams the blank salary-report Excel template to the admin. The API endpoint
 * is bearer-guarded, so a plain <a href> from the browser can't reach it — this
 * same-origin route injects the session token server-side and forwards the
 * file with an attachment disposition so the browser downloads it.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(
    `${getBaseUrl()}/api/v1/admin-report/reports/excel/template`,
    { headers: { Authorization: `Bearer ${session.idToken}` } },
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch salary report template' },
      { status: res.status },
    )
  }

  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition':
        'attachment; filename="salary-report-template.xlsx"',
    },
  })
}
