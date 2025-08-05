import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { getLogger } from '@dmr.is/logging'

import { BankruptcyApplicationScreen } from '../../../../../components/client-components/application/BankruptcyApplicationScreen'
import { authOptions } from '../../../../../lib/authOptions'
import { getClient } from '../../../../../lib/createClient'
import { safeCall } from '../../../../../lib/serverUtils'

export default async function UmsoknirThrotabusPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const logger = getLogger('LegalGazetteApplicationWeb')

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
  const { courtDistricts } = await client.getCourtDistricts()
  const application = await safeCall(() =>
    client.getBankruptcyApplicationByCaseId({
      caseId: params.id,
    }),
  )

  if (application.error) {
    logger.error('Error fetching bankruptcy application', {
      error: application.error,
      context: 'UmsoknirThrotabusPage',
    })

    if (application.error.statusCode === 404) {
      return notFound()
    }

    throw new Error()
  }

  return (
    <BankruptcyApplicationScreen
      locations={courtDistricts}
      application={application.data}
    />
  )
}
