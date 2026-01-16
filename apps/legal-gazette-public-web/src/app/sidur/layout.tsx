import { getServerSession } from 'next-auth'

import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { authOptions } from '../../lib/authOptions'
import { getBaseUrlFromServerSide } from '../../lib/utils'
import * as styles from './sidur.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const baseUrl = getBaseUrlFromServerSide()

  return (
    <>
      {session ? <Header /> : <HeaderLogin />}
      <div className={styles.contentContainer}>{children}</div>
      <LGFooter baseUrl={baseUrl} />
    </>
  )
}
