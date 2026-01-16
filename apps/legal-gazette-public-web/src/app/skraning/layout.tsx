import { getServerSession } from 'next-auth'

import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { authOptions } from '../../lib/authOptions'
import { getBaseUrlFromServerSide } from '../../lib/utils'

export default async function RootLayout({
  register,
  login,
}: {
  register: React.ReactNode
  login: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const baseUrl = getBaseUrlFromServerSide()
  return (
    <>
      {session ? (
        <>
          <Header />
          {register}
        </>
      ) : (
        <>
          <HeaderLogin />
          {login}
        </>
      )}
      <LGFooter baseUrl={baseUrl} />
    </>
  )
}
