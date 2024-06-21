import { GetServerSidePropsContext, NextApiHandler } from 'next'

export type HandlerDecorator = (handler: NextApiHandler) => NextApiHandler

export type ScreenContext = {
  query: GetServerSidePropsContext['query']
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Screen<Props = {}> = React.ComponentType<Props> & {
  getProps?: (ctx: ScreenContext) => Promise<Props>
}

export type CaseOverviewSearchParams = {
  search?: string | string[]
  department?: string | string[]
  status?: string | string[]
  type?: string | string[]
  category?: string | string[]
  page?: string | string[]
  pageSize?: string | string[]
}
