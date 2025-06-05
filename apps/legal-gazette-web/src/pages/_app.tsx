import { AppProps as NextAppProps } from 'next/app'

import { globalStyles } from '@island.is/island-ui/core'

import { Layout } from '../layout/Layout'

globalStyles()

function CustomApp({ Component, pageProps }: NextAppProps) {
  const layoutProps = pageProps.layoutProps || {}

  return (
    <>
      <main className="app">
        <Layout {...layoutProps}>
          <Component {...pageProps} />
        </Layout>
      </main>
    </>
  )
}

export default CustomApp
