'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin } from '@dmr.is/auth/useLogOut'

export default function Error({ error: _error }: { error: Error }) {
  const pathName = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])
  return <div>Error ritstjorn</div>
}
