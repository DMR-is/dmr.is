'use client'
import { SessionProvider } from 'next-auth/react'

import { ToastContainer } from '@dmr.is/ui/components/island-is'

type Props = React.ComponentProps<typeof SessionProvider>

export const Providers = ({ children, ...rest }: Props) => {
  return (
    <>
      <SessionProvider {...rest}>{children}</SessionProvider>
      <ToastContainer />
    </>
  )
}
