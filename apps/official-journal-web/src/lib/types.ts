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

export type SearchParams = {
  search?: string
  page?: number
  pageSize?: number
}

export type CaseOverviewSearchParams = SearchParams & {
  id?: string
  department?: string
  status?: string
  type?: string
  category?: string
}

export function getStringFromQueryString(
  value: string | Array<string | undefined> | undefined,
): string | undefined {
  if (!value) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function generateQueryFromParams(params?: {
  [key: string]: string | string[] | number | undefined
}) {
  if (!params) return undefined

  const p: { [key: string]: string } = {}
  Object.entries(params).forEach(([key, value]) => {
    const v = value && String(value) ? String(value) : undefined
    if (v) {
      p[key] = v
    }
  })

  return new URLSearchParams(p).toString()
}
