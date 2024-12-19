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
