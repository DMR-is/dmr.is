import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { authOptions } from '../../lib/authOptions'
import * as styles from './sidur.css'

export default async function RootLayout({
  register,
  login,
}: {
  register: React.ReactNode
  login: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session && session.user.isActive) {
    redirect('/')
  }
  return (
    <>
      {session ? (
        <>
          <Header />
          <div className={styles.contentContainer}>{register}</div>
        </>
      ) : (
        <>
          <HeaderLogin />
          <div className={styles.contentContainer}>{login}</div>
        </>
      )}
      <Footer />
    </>
  )
}
