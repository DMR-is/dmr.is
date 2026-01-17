import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { authOptions } from '../../lib/authOptions'

export default async function RootLayout({
  register,
  login,
}: {
  register: React.ReactNode
  login: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
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
    </>
  )
}
