import { GetServerSidePropsContext } from 'next'

export type ScreenContext = {
  query: GetServerSidePropsContext['query']
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}

export type Screen<Props = {}> = React.ComponentType<Props> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProps?: (ctx: ScreenContext) => Promise<Props>
}
