import { GetServerSidePropsContext } from 'next'

export type ScreenContext = {
  query: GetServerSidePropsContext['query']
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}

export type Screen<Props = {}> = React.ComponentType<Props> & {
  getProps?: (ctx: ScreenContext) => Promise<Props>
}
