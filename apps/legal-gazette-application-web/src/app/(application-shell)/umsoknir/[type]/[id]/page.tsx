import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { AdvertList } from '../../../../../components/client-components/adverts/AdvertList'
import { BankruptcyForm } from '../../../../../components/client-components/form/bankruptcy/BankruptcyForm'
import { BankruptcyApplicationDtoStatusEnum } from '../../../../../gen/fetch'
import { authOptions } from '../../../../../lib/authOptions'
import {
  ALLOWED_FORM_TYPES,
  FormTypes,
  PageRoutes,
} from '../../../../../lib/constants'
import { getClient } from '../../../../../lib/createClient'
import { safeCall } from '../../../../../lib/serverUtils'

export default async function UmsoknirThrotabusPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar finnst ekki')
  }

  const session = await getServerSession(authOptions)

  if (!session || !session.idToken) {
    return redirect(PageRoutes.LOGIN)
  }

  const client = getClient(session.idToken)

  if (params.type === FormTypes.BANKRUPTCY) {
    const applicationRes = await safeCall(() =>
      client.getBankruptcyApplicationByCaseId({ caseId: params.id }),
    )

    if (applicationRes.error) {
      if (
        applicationRes.error.statusCode >= 400 &&
        applicationRes.error.statusCode < 500
      ) {
        throw new Error('Umsókn fannst ekki')
      }

      throw new Error('Ekki tókst að sækja umsókn')
    }

    const application = applicationRes.data

    if (application.status === BankruptcyApplicationDtoStatusEnum.DRAFT) {
      const { courtDistricts } = await client.getCourtDistricts()

      return (
        <BankruptcyForm
          applicationId={application.id}
          caseId={params.id}
          application={application}
          courtOptions={courtDistricts.map((c) => ({
            label: c.title,
            value: c.id,
          }))}
        />
      )
    }
  }

  if (params.type === FormTypes.DECEASED) {
    throw new Error('Umsókn fyrir innkallanir dánarbús er í vinnslu')
  }

  if (params.type === FormTypes.COMMON) {
    throw new Error('Umsókn fyrir almennar auglýsingar er í vinnslu')
  }

  const advertsResults = await safeCall(() =>
    client.getAdvertsByCaseId({ caseId: params.id }),
  )

  if (advertsResults.error) {
    throw new Error('Ekki tókst að sækja auglýsingar fyrir þessa umsókn')
  }

  return <AdvertList adverts={advertsResults.data.adverts} />
}
