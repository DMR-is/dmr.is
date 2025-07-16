'use client'
import { SessionProvider } from 'next-auth/react'

type Props = React.ComponentProps<typeof SessionProvider>

export const Providers = (props: Props) => {
  return <SessionProvider {...props} />
}
