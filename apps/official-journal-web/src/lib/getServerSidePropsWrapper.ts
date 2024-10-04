import type { GetServerSideProps } from 'next'

import { CustomNextError } from '../units/error'
import { ScreenContext } from './types'

// Taken from here: https://github.com/vercel/next.js/discussions/11209#discussioncomment-38480
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deleteUndefined = (obj: Record<string, any> | undefined): void => {
  if (obj) {
    Object.keys(obj).forEach((key: string) => {
      if (obj[key] && typeof obj[key] === 'object') {
        deleteUndefined(obj[key])
      } else if (typeof obj[key] === 'undefined') {
        delete obj[key]
      }
    })
  }
}

type Component = {
  ({ pageProps }: { pageProps: unknown }): JSX.Element
  getProps(ctx: Partial<ScreenContext>): Promise<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageProps: { componentProps?: any; layoutProps?: any } | null
  }>
}
export const getServerSidePropsWrapper: (
  screen: Component,
) => GetServerSideProps = (screen) => async (ctx) => {
  try {
    const props = screen.getProps ? await screen.getProps(ctx) : ctx
    if ('pageProps' in props && props.pageProps?.componentProps?.redirect) {
      return props.pageProps?.componentProps
    }
    deleteUndefined(props)
    return {
      props,
    }
  } catch (error) {
    if (error instanceof CustomNextError) {
      if (error.statusCode === 404) {
        return {
          notFound: true,
        }
      }
    }
    throw error
  }
}
