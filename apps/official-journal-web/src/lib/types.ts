import { NextApiHandler } from 'next'
import { z } from 'zod'
export type HandlerDecorator = (handler: NextApiHandler) => NextApiHandler

export const overrideAttachmentSchema = z.object({
  fileName: z.string(),
  originalFileName: z.string(),
  fileFormat: z.string(),
  fileExtension: z.string(),
  fileLocation: z.string(),
  fileSize: z.number(),
})

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
  [key: string]: string | string[] | number | boolean | undefined
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
