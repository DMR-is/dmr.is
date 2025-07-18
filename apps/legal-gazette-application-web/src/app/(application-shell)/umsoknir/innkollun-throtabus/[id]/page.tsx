import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { BankruptcyApplicationScreen } from '../../../../../components/client-components/application/BankruptcyApplicationScreen'
import { getClient } from '../../../../../lib/createClient'
import { safeCall } from '../../../../../lib/serverUtils'
import { authOptions } from '../../../../api/auth/[...nextauth]/route'

export default async function UmsoknirThrotabusPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.idToken) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Aðgangur ekki heimilaður</h1>
        <p className="mb-4">
          Þú þarft að vera innskráð/ur til að skoða þessa síðu.
        </p>
      </div>
    )
  }

  const client = getClient(session.idToken)
  const applicationResults = await safeCall(() =>
    client.findOrCreateApplication({
      caseId: params.id,
    }),
  )

  if (applicationResults.error) {
    return notFound()
  }

  return <BankruptcyApplicationScreen application={applicationResults.data} />
}
