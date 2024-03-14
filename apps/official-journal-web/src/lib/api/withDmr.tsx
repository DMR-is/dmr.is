// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import { ScreenContext } from '../types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore make web strict
export const withDmr = (Component) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore make web strict
  const NewComponent = ({ pageProps }) => {
    return <Component {...pageProps} />
  }

  NewComponent.getProps = async (ctx: Partial<ScreenContext>) => {
    const newContext = { ...ctx }
    const props = Component.getProps ? await Component.getProps(newContext) : {}
    return {
      pageProps: props,
    }
  }

  return NewComponent
}

export default withDmr
