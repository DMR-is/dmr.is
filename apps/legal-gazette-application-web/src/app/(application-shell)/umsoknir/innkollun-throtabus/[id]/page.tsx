import { getServerSession } from 'next-auth'

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
  const theCase = await safeCall(() => client.getCase({ id: params.id }))

  if (!theCase.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Mál fannst ekki</h1>
        <p className="mb-4">
          Eitthvað fór úrskeiðis við að sækja mál með auðkenni: {params.id}.
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
