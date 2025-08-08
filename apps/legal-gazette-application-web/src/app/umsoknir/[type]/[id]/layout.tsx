import { getServerSession } from 'next-auth'

import { authOptions } from '../../../../lib/authOptions'

export default async function ApplicationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { type?: string }
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

  return <div>{children}</div>
}
