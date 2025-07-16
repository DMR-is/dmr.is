import { getServerSession } from 'next-auth'

import { CaseDetailedDto } from '../../../../../gen/fetch'
import { getClient } from '../../../../../lib/createClient'
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
  let theCase: CaseDetailedDto | null = null

  try {
    theCase = await client.getCase({ id: params.id })
  } catch (error) {
    console.log('Error fetching case:', error)
  }

  console.log(theCase)

  if (!theCase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Mál fannst ekki</h1>
        <p className="mb-4">
          Eitthvað fór úrskeiðis við að sækja mál með ID: {params.id}.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Innkollun þrotabús</h1>
        <p className="mb-4">
          Hér getur þú sótt um innkollun þrotabús. Vinsamlegast fylgdu
          leiðbeiningunum hér að neðan.
        </p>
        {/* Add your form or content here */}
      </div>
    </>
  )
}
