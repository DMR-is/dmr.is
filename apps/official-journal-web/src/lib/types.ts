import { GetServerSidePropsContext } from 'next'

export type ScreenContext = {
  query: GetServerSidePropsContext['query']
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Screen<Props = {}> = React.ComponentType<Props> & {
  getProps?: (ctx: ScreenContext) => Promise<Props>
}
