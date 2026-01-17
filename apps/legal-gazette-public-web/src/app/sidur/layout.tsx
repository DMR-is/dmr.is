import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { authOptions } from '../../lib/authOptions'
import * as styles from './sidur.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <>
      {session ? <Header /> : <HeaderLogin />}
      <div className={styles.contentContainer}>{children}</div>
    </>
  )
}
