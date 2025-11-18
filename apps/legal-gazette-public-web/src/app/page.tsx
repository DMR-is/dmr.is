import { getServerSession } from 'next-auth'

import { HomePage } from '../components/server-components/front-page/HomePage'
import { LandingPage } from '../components/server-components/front-page/LandingPage'
import { authOptions } from '../lib/authOptions'

import '../styles/global.css'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  return session ? <HomePage /> : <LandingPage />
}
