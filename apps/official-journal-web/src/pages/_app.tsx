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
  pageProps,
}: AppProps<InheritedPageProps>) {
  return (
    <SessionProvider session={pageProps.session} refetchInterval={5 * 60}>
      <Layout {...pageProps.layout}>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}
