import { AppProps as NextAppProps } from 'next/app'
import Head from 'next/head'
import { SessionProvider } from 'next-auth/react'

import { Layout } from '../components/layout/Layout'

function CustomApp({ Component, pageProps: { session, ...pageProps } }: NextAppProps) {
  return (
    <>
      <Head>
        <title>Lögbirtingarblaðið</title>
      </Head>
      <main className="app">
        <SessionProvider
          session={session}
          refetchInterval={1 * 60}
          refetchOnWindowFocus={true}
          basePath="/api/auth"
        >
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SessionProvider>
      </main>
    </>
  )
}

export default CustomApp
