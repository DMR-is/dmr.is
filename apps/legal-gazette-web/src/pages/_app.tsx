import { AppProps as NextAppProps } from 'next/app'

import { globalStyles } from '@island.is/island-ui/core'

globalStyles()
function CustomApp({ Component, pageProps }: NextAppProps) {
  return (
    <>
      <main className="app">
        <Component {...pageProps} />
      </main>
    </>
  )
}

export default CustomApp
