import { AppProps as NextAppProps } from 'next/app'

import { globalStyles } from '@island.is/island-ui/core/utils/globalStyles'

import { Layout } from '../layout/Layout'

globalStyles()

function CustomApp({ Component, pageProps }: NextAppProps) {
  return (
    <>
      <main className="app">
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </main>
    </>
  )
}

export default CustomApp
