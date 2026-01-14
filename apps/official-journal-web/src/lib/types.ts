import { NextApiHandler } from 'next'

import * as z from 'zod'
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

export type NullableExcept<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | null
}

export function getStringFromQueryString(
  value: string | Array<string | undefined> | undefined,
): string | undefined {
  if (!value) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.join(',')
  }

  return value
}
