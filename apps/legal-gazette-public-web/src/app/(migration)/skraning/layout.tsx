import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '../../../lib/authOptions'

export default async function Layout(props: { children: React.ReactNode }) {
  const { children } = props
  const session = await getServerSession(authOptions)

  if (session && session.user.isActive) {
    redirect('/')
  }

  return <>{children}</>
}
