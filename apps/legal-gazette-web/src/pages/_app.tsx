import { AppProps as NextAppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'

import { globalStyles } from '@island.is/island-ui/core'

import { Layout } from '../layout/Layout'

globalStyles()

function CustomApp({ Component, pageProps: { session, ...pageProps } }: NextAppProps) {
  const layoutProps = pageProps.layoutProps || {}

  return (
    <SessionProvider
    session={session}
    refetchInterval={1 * 60}
    refetchOnWindowFocus={true}
    basePath="/api/auth"
  >
      <main className="app">
        <Layout {...layoutProps}>
          <Component {...pageProps} />
        </Layout>
      </main>
    </SessionProvider>
  )
}

export default CustomApp
