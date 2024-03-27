import { AppProps } from 'next/app'
import { ScreenContext, Screen } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withDmr = (Component: Screen<any>) => {
  const NewComponent = ({
    pageProps,
  }: {
    pageProps: AppProps['pageProps']
  }) => {
    return <Component {...pageProps} />
  }

  NewComponent.getProps = async (ctx: ScreenContext) => {
    const newContext: ScreenContext = { ...ctx }
    const props = Component.getProps ? await Component.getProps(newContext) : {}
    return {
      pageProps: props,
    }
  }

  return NewComponent
}

export default withDmr
