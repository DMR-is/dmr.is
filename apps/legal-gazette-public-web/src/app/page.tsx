import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

import { HomePage } from '../components/server-components/front-page/HomePage'
import { LandingPage } from '../components/server-components/front-page/LandingPage'
import { authOptions } from '../lib/authOptions'

import '../styles/global.css'

export default async function RootPage() {
  const session = await getServerSession(authOptions)


  throw new Error('Internal server error')

  return (
    <>
    {/* TODO: Make user aware that he needs to sign up as a subscriber if session and not active */}
      {session ? <Header /> : <HeaderLogin variant="white" />}
      {session?.user.isActive ? <HomePage /> : <LandingPage />}
    </>
  )
}
