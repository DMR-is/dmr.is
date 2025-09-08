import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { ApplicationSubmitted } from '../../../../../components/client-components/application/ApplicationSubmitted'
import { ApplicationForm } from '../../../../../components/client-components/form/ApplicationForm'
import { ApplicationProvider } from '../../../../../context/applicationContext'
import {
  ApplicationDetailedDtoStatusEnum,
  ApplicationTypeEnum,
} from '../../../../../gen/fetch'
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

  const applicationResult = await safeCall(() =>
    client.getApplicationByCaseId({ caseId: params.id }),
  )

  if (applicationResult.error) {
    if (applicationResult.error.statusCode === 404) {
      throw new Error('Umsókn fannst ekki')
    }

    throw new Error('Ekki tókst að sækja umsókn')
  }

  if (
    applicationResult.data.status !== ApplicationDetailedDtoStatusEnum.DRAFT
  ) {
    const advertsResults = await safeCall(() =>
      client.getAdvertsByCaseId({ caseId: params.id }),
    )

    if (advertsResults.error) {
      throw new Error('Ekki tókst að sækja auglýsingar fyrir þessa umsókn')
    }

    return (
      <ApplicationProvider application={applicationResult.data}>
        <ApplicationSubmitted adverts={advertsResults.data.adverts} />
      </ApplicationProvider>
    )
  }

  const { courtDistricts } = await client.getCourtDistricts()
  const { categories } = await client.getCategories({
    type: 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
  })

  return (
    <ApplicationForm
      caseId={params.id}
      application={applicationResult.data}
      categories={categories.map((category) => ({
        label: category.title,
        value: category.id,
      }))}
      courtDistricts={courtDistricts.map((court) => ({
        label: court.title,
        value: court.id,
      }))}
    />
  )
}
