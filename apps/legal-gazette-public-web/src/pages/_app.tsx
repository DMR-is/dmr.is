import { AppProps } from 'next/app'
import Head from 'next/head'

import { Layout } from '../components/layout/Layout'

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Lögbirtingarblaðið</title>
      </Head>
      <main className="app">
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </main>
    </>
  )
}

export default CustomApp
