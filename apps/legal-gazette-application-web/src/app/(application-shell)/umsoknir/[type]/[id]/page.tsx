import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { AdvertList } from '../../../../../components/client-components/adverts/AdvertList'
import { CommonForm } from '../../../../../components/client-components/form/common/CommonForm'
import { RecallForm } from '../../../../../components/client-components/form/recall/RecallForm'
import { ApplicationStatusEnum } from '../../../../../gen/fetch'
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

  if (
    params.type === FormTypes.BANKRUPTCY ||
    params.type === FormTypes.DECEASED
  ) {
    const applicationRes = await safeCall(() =>
      client.getRecallApplicationByCaseId({ caseId: params.id }),
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

    if (application.status === ApplicationStatusEnum.DRAFT) {
      const { courtDistricts } = await client.getCourtDistricts()

      return (
        <RecallForm
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

  if (params.type === FormTypes.COMMON) {
    const application = await safeCall(() =>
      client.getCommonApplicationByCaseId({ caseId: params.id }),
    )

    if (application.error) {
      throw new Error('Umsókn fyrir almennar auglýsingar er í vinnslu')
    }

    if (application.data.status === ApplicationStatusEnum.DRAFT) {
      const { categories } = await client.getCategories({
        type: 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
      })

      return (
        <CommonForm
          application={application.data}
          applicationId={application.data.id}
          caseId={params.id}
          categories={categories.map((c) => ({ label: c.title, value: c.id }))}
        />
      )
    }
  }

  const advertsResults = await safeCall(() =>
    client.getAdvertsByCaseId({ caseId: params.id }),
  )

  if (advertsResults.error) {
    throw new Error('Ekki tókst að sækja auglýsingar fyrir þessa umsókn')
  }

  return <AdvertList adverts={advertsResults.data.adverts} />
}
