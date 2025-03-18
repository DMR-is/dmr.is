/* eslint-disable no-console */
import { AppProps as NextAppProps } from 'next/app'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { globalStyles } from '@island.is/island-ui/core'

import { Layout, LayoutProps } from '../layout/Layout'

globalStyles()

type InheritedPageProps = {
  session: Session | null
  layout: LayoutProps | null
}

type AppProps<P> = {
  pageProps: P
} & Omit<NextAppProps<P>, 'pageProps'>

export default function App({
  Component,
  pageProps: { session, layout, ...pageProps },
}: AppProps<InheritedPageProps>) {
  const originalError = console.error
  console.error = (...args: any[]) => {
    if (args[0].includes('useLayoutEffect does nothing on the server')) {
      return
    }
    originalError(...args)
  }

  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60}
      basePath="/api/auth"
    >
      <Layout {...layout}>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}
